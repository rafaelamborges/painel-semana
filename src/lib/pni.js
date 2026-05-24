/**
 * Brazilian National Immunization Program (PNI) vaccination schedule.
 * Adapted for tracking purposes per child age.
 */

export const PNI_SCHEDULE = [
  { id: 'bcg', name: 'BCG', doses: [{ label: 'Dose única', ageMonths: 0 }], notes: 'Aplicada ao nascer' },
  { id: 'hep_b_0', name: 'Hepatite B', doses: [
    { label: '1ª dose', ageMonths: 0 },
    { label: '2ª dose', ageMonths: 1 },
    { label: '3ª dose', ageMonths: 6 },
  ]},
  { id: 'penta', name: 'Pentavalente (DTP/Hib/HepB)', doses: [
    { label: '1ª dose', ageMonths: 2 },
    { label: '2ª dose', ageMonths: 4 },
    { label: '3ª dose', ageMonths: 6 },
  ]},
  { id: 'vip', name: 'Poliomielite inativada (VIP)', doses: [
    { label: '1ª dose', ageMonths: 2 },
    { label: '2ª dose', ageMonths: 4 },
    { label: '3ª dose', ageMonths: 6 },
  ]},
  { id: 'vrh', name: 'Rotavírus humano (RHV)', doses: [
    { label: '1ª dose', ageMonths: 2 },
    { label: '2ª dose', ageMonths: 4 },
  ]},
  { id: 'pneumo', name: 'Pneumocócica 10-valente', doses: [
    { label: '1ª dose', ageMonths: 2 },
    { label: '2ª dose', ageMonths: 4 },
    { label: 'Reforço', ageMonths: 12 },
  ]},
  { id: 'meningo_c', name: 'Meningocócica C', doses: [
    { label: '1ª dose', ageMonths: 3 },
    { label: '2ª dose', ageMonths: 5 },
    { label: 'Reforço', ageMonths: 12 },
  ]},
  { id: 'fa', name: 'Febre Amarela', doses: [
    { label: 'Dose única', ageMonths: 9 },
  ]},
  { id: 'scr', name: 'Tríplice viral (SCR)', doses: [
    { label: '1ª dose', ageMonths: 12 },
    { label: '2ª dose', ageMonths: 15 },
  ]},
  { id: 'dtp_r', name: 'DTP (reforço)', doses: [
    { label: '1º reforço', ageMonths: 15 },
    { label: '2º reforço', ageMonths: 48 },
  ]},
  { id: 'vop', name: 'Poliomielite oral (VOP)', doses: [
    { label: '1º reforço', ageMonths: 15 },
    { label: '2º reforço', ageMonths: 48 },
  ]},
  { id: 'hep_a', name: 'Hepatite A', doses: [
    { label: 'Dose única', ageMonths: 15 },
  ]},
  { id: 'varicela', name: 'Varicela', doses: [
    { label: '1ª dose', ageMonths: 15 },
    { label: 'Reforço', ageMonths: 48 },
  ]},
  { id: 'meningo_acwy', name: 'Meningocócica ACWY', doses: [
    { label: 'Dose única', ageMonths: 132 }, // 11 anos
  ]},
  { id: 'hpv', name: 'HPV', doses: [
    { label: '1ª dose', ageMonths: 132 }, // 11 anos
    { label: '2ª dose', ageMonths: 138 }, // 11,5 anos
  ]},
  { id: 'influenza', name: 'Influenza (gripe)', doses: [
    { label: 'Anual', ageMonths: 6 },
  ], notes: 'Aplicar anualmente, a partir de 6 meses' },
  { id: 'dt', name: 'dT/Tdap (adulto)', doses: [
    { label: 'Reforço a cada 10 anos', ageMonths: 120 }, // 10 anos
  ]},
]

/**
 * Generate vaccination schedule for a child based on birth date.
 * Returns array of { vaccine, dose, scheduledDate, status }
 */
export function generateVaccinationSchedule(birthDate) {
  const birth = new Date(birthDate)
  const today = new Date()
  const schedule = []

  for (const vaccine of PNI_SCHEDULE) {
    for (const dose of vaccine.doses) {
      const scheduled = new Date(birth)
      scheduled.setMonth(scheduled.getMonth() + dose.ageMonths)

      let status = 'scheduled'
      if (scheduled < today) {
        status = 'overdue'
      }

      schedule.push({
        id: `${vaccine.id}_${dose.label}`,
        vaccine_id: vaccine.id,
        vaccine_name: vaccine.name,
        dose_label: dose.label,
        scheduledDate: scheduled,
        status,
        notes: vaccine.notes || null,
      })
    }
  }

  return schedule.sort((a, b) => a.scheduledDate - b.scheduledDate)
}

/**
 * Get upcoming vaccines (next 90 days) and overdue ones.
 */
export function getVaccineAlerts(birthDate, administered = []) {
  const schedule = generateVaccinationSchedule(birthDate)
  const today = new Date()
  const in90Days = new Date(today)
  in90Days.setDate(in90Days.getDate() + 90)

  const administeredIds = new Set(administered.map(a => a.id || `${a.vaccine_id}_${a.dose_label}`))

  return schedule.filter(v => {
    if (administeredIds.has(v.id)) return false
    return v.scheduledDate <= in90Days
  })
}
