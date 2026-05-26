import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useFamily } from '../context/FamilyContext'

const STEPS = ['Família', 'Criança', 'Você', 'Guarda']

export default function Onboarding() {
  const { user } = useAuth()
  const { reload } = useFamily()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 0 – Family
  const [familyName, setFamilyName] = useState('')

  // Step 1 – Child
  const [childName, setChildName] = useState('Daniel')
  const [birthDate, setBirthDate] = useState('2016-05-01')
  const [school, setSchool] = useState('CBV Jaqueira')
  const [grade, setGrade] = useState('5º ano')

  // Step 2 – Your profile
  const [yourName, setYourName] = useState('')
  const [yourRole, setYourRole] = useState('mother')
  const [yourColor, setYourColor] = useState('#3b82f6')

  // Step 3 – Guard pattern
  const [coparentName, setCoparentName] = useState('')
  const [coparentEmail, setCoparentEmail] = useState('')
  const [coparentColor, setCoparentColor] = useState('#10b981')
  const [referenceDate, setReferenceDate] = useState('2026-05-20')
  const [referenceGuardian, setReferenceGuardian] = useState('mother')

  async function handleFinish() {
    setError('')
    setLoading(true)
    try {
      const familyId = crypto.randomUUID()
      const myMemberId = crypto.randomUUID()
      const coparentMemberId = crypto.randomUUID()
      const childId = crypto.randomUUID()
      const refMemberId = referenceGuardian === yourRole
        ? myMemberId
        : (coparentName ? coparentMemberId : myMemberId)

      const { error } = await supabase.rpc('create_family_onboarding', {
        p_family_id: familyId,
        p_family_name: familyName || `Família ${childName}`,
        p_my_member_id: myMemberId,
        p_my_name: yourName || user.email,
        p_my_email: user.email,
        p_my_role: yourRole,
        p_my_color: yourColor,
        p_coparent_member_id: coparentMemberId,
        p_coparent_name: coparentName || '',
        p_coparent_email: coparentEmail || '',
        p_coparent_color: coparentColor,
        p_child_id: childId,
        p_child_name: childName,
        p_child_birth_date: birthDate,
        p_child_school: school || '',
        p_child_grade: grade || '',
        p_reference_date: referenceDate,
        p_reference_guardian: referenceGuardian,
        p_reference_member_id: refMemberId,
      })
      if (error) throw error

      // Ensure creator is sysadmin (default column is 'editor')
      await supabase
        .from('family_members')
        .update({ access_role: 'sysadmin' })
        .eq('id', myMemberId)

      await reload()
      navigate('/')
    } catch (err) {
      setError(err.message || 'Erro ao salvar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function next() {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else handleFinish()
  }

  function back() {
    if (step > 0) setStep(s => s - 1)
  }

  const canProceed = [
    true,
    childName && birthDate,
    yourName,
    referenceDate,
  ][step]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-brand-700">Configurar o Compasso</h1>
          <p className="text-gray-500 text-sm mt-1">Passo {step + 1} de {STEPS.length}</p>
        </div>

        <div className="flex gap-1 mb-6">
          {STEPS.map((label, i) => (
            <div key={i} className="flex-1">
              <div className={`h-1.5 rounded-full transition-colors ${i <= step ? 'bg-brand-500' : 'bg-gray-200'}`} />
              <p className={`text-xs mt-1 text-center ${i === step ? 'text-brand-600 font-medium' : 'text-gray-400'}`}>{label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Como se chama a família?</h2>
              <p className="text-sm text-gray-500">Será o nome do espaço compartilhado entre os pais.</p>
              <input
                type="text"
                placeholder={`Família ${childName || 'Silva'}`}
                value={familyName}
                onChange={e => setFamilyName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
              />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Quem é a criança?</h2>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Nome completo</label>
                <input type="text" value={childName} onChange={e => setChildName(e.target.value)} required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Data de nascimento</label>
                <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Escola</label>
                <input type="text" value={school} onChange={e => setSchool(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Turma / Ano</label>
                <input type="text" value={grade} onChange={e => setGrade(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:r-brand-300" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Seu perfil</h2>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Seu nome</label>
                <input type="text" value={yourName} onChange={e => setYourName(e.target.value)} required placeholder="Como quer ser chamado(a)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Papel</label>
                <div className="flex gap-3">
                  {['mother', 'father'].map(role => (
                    <button key={role} type="button" onClick={() => {
                      setYourRole(role)
                      setYourColor(role === 'mother' ? '#3b82f6' : '#10b981')
                      setCoparentColor(role === 'mother' ? '#10b981' : '#3b82f6')
                    }}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${yourRole === role ? 'bg-brand-50 border-brand-400 text-brand-700' : 'border-gray-200 text-gray-600'}`}>
                      {role === 'mother' ? '💙 Mãe' : '💚 Pai'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Sua cor no calendário</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={yourColor} onChange={e => setYourColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border-0 cursor-pointer" />
                  <span className="text-sm text-gray-500">Cor usada para pintar suas semanas de guarda</span>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Configurar a guarda</h2>
              <p className="text-sm text-gray-500">Guarda alternada semanal com troca às terças.</p>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Nome do(a) coparent (opcional)</label>
                <input type="text" value={coparentName} onChange={e => setCoparentName(e.target.value)} placeholder="Nome do pai/mãe"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Email para convidar (opcional)</label>
                <input type="email" value={coparentEmail} onChange={e => setCoparentEmail(e.target.value)} placeholder="email@exemplo.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Cor do(a) coparent</label>
                <input type="color" value={coparentColor} onChange={e => setCoparentColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border-0 cursor-pointer" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Data de referência (uma terça-feira)</label>
                <input type="date" value={referenceDate} onChange={e => setReferenceDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Quem tem a guarda nessa semana de referência?</label>
                <div className="flex gap-3">
                  {['mother', 'father'].map(role => (
                    <button key={role} type="button" onClick={() => setReferenceGuardian(role)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${referenceGuardian === role ? 'bg-brand-50 border-brand-400 text-brand-700' : 'border-gray-200 text-gray-600'}`}>
                      {role === 'mother' ? '💙 Mãe' : '💚 Pai'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button onClick={back} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Voltar
              </button>
            )}
            <button
              onClick={next}
              disabled={!canProceed || loading}
              className="flex-1 py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Salvando…' : step === STEPS.length - 1 ? 'Começar!' : 'Próximo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
