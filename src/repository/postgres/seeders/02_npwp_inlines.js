/**
 * Seeder: Initial data for npwp_inlines table
 */

exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('npwp_inlines').del();

  // Inserts seed entries
  await knex('npwp_inlines').insert([
    {
      id: 1,
      company_name: 'MOTOR SIGHTS INTERNATIONAL',
      abbreviation: 'MSI',
      nomor: '0659528178043000',
      id_type: 'TIN',
      country_code: 'IDN',
      nitku: '0659528178043000000000',
      is_delete: false
    },
    {
      id: 2,
      company_name: 'INLINE TECHNOLOGY INTERNATIONAL',
      abbreviation: 'ITI',
      nomor: '0396696734043000',
      id_type: 'TIN',
      country_code: 'IDN',
      nitku: '0396696734043000000000',
      is_delete: false
    },
    {
      id: 3,
      company_name: 'MOTOR SIGHTS OVERSEAS',
      abbreviation: 'MSO',
      nomor: '0281223800043000',
      id_type: 'TIN',
      country_code: 'IDN',
      nitku: '0281223800043000000000',
      is_delete: false
    },
    {
      id: 4,
      company_name: 'ELIT TYRE INTERNATIONAL',
      abbreviation: 'ETI',
      nomor: '1000000000293559',
      id_type: 'TIN',
      country_code: 'IDN',
      nitku: '1000000000293559000000',
      is_delete: false
    },
    {
      id: 5,
      company_name: 'INDONESIA EQUIPMENT CENTRE',
      abbreviation: 'IEC',
      nomor: '0700310048045000',
      id_type: 'TIN',
      country_code: 'IDN',
      nitku: '0700310048045000000000',
      is_delete: false
    },
    {
      id: 6,
      company_name: 'INDONESIA EQUIPMENT LINE',
      abbreviation: 'IEL',
      nomor: '0700034150045000',
      id_type: 'TIN',
      country_code: 'IDN',
      nitku: '0700034150045000000000',
      is_delete: false
    }
  ]);
};
