import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Proper RFC-4180 CSV parser — handles quoted fields, commas inside quotes, \r\n and \n
function parseCSV(raw: string): Record<string, string>[] {
  // Strip UTF-8 BOM if present (Excel exports this)
  const text = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        // Escaped quote
        field += '"';
        i += 2;
      } else if (ch === '"') {
        inQuotes = false;
        i++;
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ',') {
        row.push(field.trim());
        field = '';
        i++;
      } else if (ch === '\n') {
        row.push(field.trim());
        field = '';
        if (row.some(f => f !== '')) rows.push(row);
        row = [];
        i++;
      } else {
        field += ch;
        i++;
      }
    }
  }
  // Last field/row
  row.push(field.trim());
  if (row.some(f => f !== '')) rows.push(row);

  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.toLowerCase().replace(/[\s_-]/g, ''));

  // Flexible column name mapping — handles variations from different sheet exports
  function findCol(candidates: string[]): number {
    for (const c of candidates) {
      const idx = headers.findIndex(h => h === c || h.includes(c));
      if (idx !== -1) return idx;
    }
    return -1;
  }

  const colMap = {
    name:           findCol(['name', 'fullname', 'contactname', 'person']),
    email:          findCol(['email', 'emailaddress', 'mail']),
    phone:          findCol(['phone', 'phonenumber', 'mobile', 'contact', 'tel']),
    company:        findCol(['company', 'organization', 'org', 'employer', 'companyname']),
    jobProfile:     findCol(['jobprofile', 'jobtitle', 'title', 'role', 'position', 'designation']),
    platform:       findCol(['platform', 'source', 'channel', 'via']),
    profileLink:    findCol(['profilelink', 'linkedin', 'url', 'link', 'profile']),
    status:         findCol(['status']),
    responseStatus: findCol(['responsestatus', 'response']),
    priority:       findCol(['priority']),
    tags:           findCol(['tags', 'tag', 'labels']),
    notes:          findCol(['notes', 'note', 'comments', 'remarks', 'description']),
    followUpDate:   findCol(['followupdate', 'followup', 'nextcontact', 'nextfollowup']),
  };

  const VALID_STATUSES = new Set([
    'NEW', 'CONTACTED', 'AWAITING_RESPONSE', 'REPLIED',
    'INTERVIEW_SCHEDULED', 'OFFER_RECEIVED', 'WON', 'LOST',
  ]);
  const VALID_PRIORITIES = new Set(['LOW', 'MEDIUM', 'HIGH']);

  function get(dataRow: string[], col: number): string {
    return col !== -1 ? (dataRow[col] || '').trim() : '';
  }

  function normalizeStatus(v: string): string {
    const upper = v.toUpperCase().replace(/[\s-]/g, '_');
    return VALID_STATUSES.has(upper) ? upper : 'NEW';
  }

  function normalizePriority(v: string): string {
    const upper = v.toUpperCase();
    return VALID_PRIORITIES.has(upper) ? upper : 'MEDIUM';
  }

  function parseDate(v: string): string | null {
    if (!v) return null;
    // Try common date formats
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d.toISOString();
    // Try DD/MM/YYYY
    const ddmm = v.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (ddmm) {
      const [, dd, mm, yy] = ddmm;
      const year = yy.length === 2 ? `20${yy}` : yy;
      const d2 = new Date(`${year}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`);
      if (!isNaN(d2.getTime())) return d2.toISOString();
    }
    return null;
  }

  return rows.slice(1).map(dataRow => {
    const name = get(dataRow, colMap.name);
    if (!name) return null;
    return {
      name,
      email:          get(dataRow, colMap.email),
      phone:          get(dataRow, colMap.phone),
      company:        get(dataRow, colMap.company),
      jobProfile:     get(dataRow, colMap.jobProfile),
      platform:       get(dataRow, colMap.platform),
      profileLink:    get(dataRow, colMap.profileLink),
      status:         normalizeStatus(get(dataRow, colMap.status)),
      responseStatus: get(dataRow, colMap.responseStatus).toUpperCase() === 'REPLIED' ? 'REPLIED' : 'NO_REPLY',
      priority:       normalizePriority(get(dataRow, colMap.priority)),
      tags:           get(dataRow, colMap.tags),
      notes:          get(dataRow, colMap.notes),
      followUpDate:   parseDate(get(dataRow, colMap.followUpDate)),
    };
  }).filter(Boolean) as Record<string, string>[];
}

export async function POST(req: NextRequest) {
  let text: string;
  try {
    text = await req.text();
  } catch {
    return NextResponse.json({ error: 'Failed to read request body' }, { status: 400 });
  }

  if (!text.trim()) {
    return NextResponse.json({ created: 0, errors: 0, message: 'Empty file' });
  }

  let rows: Record<string, string>[];
  try {
    rows = parseCSV(text);
  } catch {
    return NextResponse.json({ error: 'Failed to parse CSV' }, { status: 400 });
  }

  if (rows.length === 0) {
    return NextResponse.json({ created: 0, errors: 0, message: 'No valid rows found. Make sure your CSV has a "name" column.' });
  }

  const results = { created: 0, errors: 0 };
  const BATCH_SIZE = 50;

  // Process in batches to avoid DB timeouts on large files
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(
      batch.map(async (row) => {
        try {
          await prisma.contact.create({
            data: {
              name:           row.name,
              email:          row.email || null,
              phone:          row.phone || null,
              company:        row.company || null,
              jobProfile:     row.jobProfile || null,
              platform:       row.platform || null,
              profileLink:    row.profileLink || null,
              status:         row.status as never,
              responseStatus: row.responseStatus as never,
              priority:       row.priority as never,
              tags:           row.tags ? row.tags.split(/[,;]/).map(t => t.trim()).filter(Boolean) : [],
              notes:          row.notes || null,
              followUpDate:   row.followUpDate ? new Date(row.followUpDate) : null,
              activities: {
                create: {
                  type: 'CONTACT_CREATED',
                  description: `Imported: ${row.name}${row.company ? ` from ${row.company}` : ''}`,
                },
              },
            },
          });
          results.created++;
        } catch {
          results.errors++;
        }
      })
    );
  }

  return NextResponse.json({
    created: results.created,
    errors: results.errors,
    total: rows.length,
    message: `Successfully imported ${results.created} of ${rows.length} contacts.${results.errors > 0 ? ` ${results.errors} rows had errors.` : ''}`,
  });
}
