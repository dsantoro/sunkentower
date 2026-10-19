import { useEffect, useState } from 'react'
import { CalendarDays, Check, Clock3, LogOut, Moon, Pencil, Plus, Sun, Trash2, X } from 'lucide-react'
import { getGameDate, getNextAvailableAt, formatCountdown, formatShortDate, toDateInputValue } from './tower.js'
import { isSupabaseConfigured, supabase } from './supabase.js'
import './App.css'

const STORAGE_KEY = 'torre-de-prontera.characters'
const THEME_KEY = 'torre-de-prontera.theme'
const DEFAULT_JOB_FILE = 'Cavaleiros Rúnicospartyicn.png'
const excludedJobFiles = new Set([
  'Aprendizespartyicn.png',
  'Noviçospartyicn.png',
  'Espadachinspartyicn.png',
  'Magospartyicn.png',
  'Arqueirospartyicn.png',
  'Gatunospartyicn.png',
  'Mercadorespartyicn.png',
  'Alquimistaspartyicn.png',
  'Bardospartyicn.png',
  'Bruxospartyicn.png',
  'Caçadorespartyicn.png',
  'Cavaleirospartyicn.png',
  'Ferreirospartyicn.png',
  'Mercenáriospartyicn.png',
  'Mongespartyicn.png',
  'Odaliscaspartyicn.png',
  'Sacerdotespartyicn.png',
  'Sábiospartyicn.png',
  'Espiritualistaspartyicn.png',
  'Justiceirospartyicn.png',
  'Kageroupartyicn.png',
  'Ninjaspartyicn.png',
  'Oboropartyicn.png',
  'Taekwonspartyicn.png',
  'Mestres Taekwonspartyicn.png',
])
const jobImageUrls = import.meta.glob('./assets/jobs/*.png', { eager: true, query: '?url', import: 'default' })
const legacyJobFiles = {
  'High_Novice.png': DEFAULT_JOB_FILE,
  'Assassin_Cross.png': 'Algozespartyicn.png',
  'Champion.png': 'Mestrespartyicn.png',
  'Biochemist.png': 'Bioquímicospartyicn.png',
  'Gypsy.png': 'Ciganaspartyicn.png',
  'High_Priest.png': 'Sumo Sacerdotespartyicn.png',
  'High_Wizard.png': 'Arquimagospartyicn.png',
  'Lord_Knight.png': 'Lordespartyicn.png',
  'Mastersmith.png': 'Mestres-Ferreirospartyicn.png',
  'Minstrel.png': 'Trovadorespartyicn.png',
  'Scholar.png': 'Professorespartyicn.png',
  'Sniper.png': 'Atiradores de Elitepartyicn.png',
  'Stalker.png': 'Desordeirospartyicn.png',
  'Rune_Knight.png': 'Cavaleiros Rúnicospartyicn.png',
}

const jobClasses = Object.keys(jobImageUrls)
  .map((path) => path.split('/').at(-1))
  .filter((file) => file.endsWith('partyicn.png'))
  .filter((file) => !excludedJobFiles.has(file))
  .map((file) => ({
    file,
    name: file.replace(/partyicn\.png$/i, '').replaceAll('_', ' ').trim(),
  }))
  .sort((first, second) => first.name.localeCompare(second.name, 'pt-BR'))

function resolveJobFile(file) {
  const resolvedFile = legacyJobFiles[file] || file
  return jobClasses.some((job) => job.file === resolvedFile) ? resolvedFile : DEFAULT_JOB_FILE
}

function readCharacters() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') }
  catch { return [] }
}

function mapDatabaseCharacter(row) {
  return {
    id: row.id,
    name: row.name,
    jobFile: resolveJobFile(row.job_file),
    lastDoneDate: row.last_done_date,
  }
}

function AuthScreen({ theme, onToggleTheme, onAuthenticate }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)

  async function submit(event) {
    event.preventDefault()
    if (mode === 'signup' && password !== passwordConfirmation) {
      setMessage({ type: 'error', text: 'As senhas não coincidem.' })
      return
    }
    setBusy(true)
    setMessage(null)
    try {
      const result = await onAuthenticate({ mode, email: email.trim(), password })
      setMessage({ type: 'success', text: result })
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Não foi possível autenticar. Tente novamente.' })
    } finally {
      setBusy(false)
    }
  }

  function changeMode(nextMode) {
    setMode(nextMode)
    setMessage(null)
  }

  return (
    <main className="app-shell auth-shell" data-theme={theme}>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Torre de Prontera">
          <span className="brand-mark"><span /><span /><span /></span>
          <span className="brand-name">TORRE <b>DE PRONTERA</b></span>
        </a>
        <button className="theme-toggle" type="button" onClick={onToggleTheme} aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'} title={theme === 'light' ? 'Modo escuro' : 'Modo claro'}>
          {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
        </button>
      </header>
      <div className="auth-layout" id="top">
        <section className="auth-welcome">
          <span className="eyebrow"><span className="eyebrow-line" /> TORRE DE PRONTERA</span>
          <h1>Seu esquadrão,<br />sempre no tempo.</h1>
          <p>Entre para acompanhar a torre dos seus personagens em qualquer dispositivo.</p>
          <div className="auth-emblem" aria-hidden="true">
            <span className="emblem-ring ring-outer" />
            <span className="emblem-ring ring-inner" />
            <span className="emblem-tower"><i /><i /><i /><b /></span>
            <span className="emblem-star">✦</span>
          </div>
          <span className="auth-reset-note"><Clock3 size={14} /> Reset diário às <b>04:00</b></span>
        </section>
        <section className="auth-panel" aria-labelledby="auth-title">
          <span className="eyebrow">SUA CONTA</span>
          <h2 id="auth-title">{mode === 'login' ? 'Boas-vindas de volta' : 'Crie sua conta'}</h2>
          <p className="auth-subtitle">{mode === 'login' ? 'Entre para acessar seus personagens.' : 'Comece a organizar suas torres.'}</p>
          <div className="auth-tabs" role="tablist" aria-label="Acesso à conta">
            <button aria-selected={mode === 'login'} className={mode === 'login' ? 'active' : ''} onClick={() => changeMode('login')} role="tab" type="button">Entrar</button>
            <button aria-selected={mode === 'signup'} className={mode === 'signup' ? 'active' : ''} onClick={() => changeMode('signup')} role="tab" type="button">Criar conta</button>
          </div>
          <form className="auth-form" onSubmit={submit}>
            <label className="field-label" htmlFor="account-email">E-mail</label>
            <input autoComplete="email" id="account-email" onChange={(event) => setEmail(event.target.value)} placeholder="voce@exemplo.com" required type="email" value={email} />
            <label className="field-label" htmlFor="account-password">Senha</label>
            <input autoComplete={mode === 'login' ? 'current-password' : 'new-password'} id="account-password" minLength={6} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo de 6 caracteres" required type="password" value={password} />
            {mode === 'signup' && <>
              <label className="field-label" htmlFor="account-password-confirm">Confirme a senha</label>
              <input autoComplete="new-password" id="account-password-confirm" minLength={6} onChange={(event) => setPasswordConfirmation(event.target.value)} placeholder="Digite a senha novamente" required type="password" value={passwordConfirmation} />
            </>}
            {message && <p className={`auth-message ${message.type}`} role="status">{message.text}</p>}
            <button className="button button-primary auth-submit" disabled={busy} type="submit">{busy ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}</button>
          </form>
          <p className="auth-security-note">Sua senha é protegida pelo Supabase Auth e nunca é armazenada nos dados dos personagens.</p>
        </section>
      </div>
      <footer className="auth-footer"><span>TORRE DE PRONTERA</span><span>Dados sincronizados com sua conta.</span></footer>
    </main>
  )
}

function Avatar({ jobFile, name, large = false }) {
  const file = resolveJobFile(jobFile)
  const job = jobClasses.find((item) => item.file === file)
  return (
    <span className={`avatar${large ? ' avatar-large' : ''}`}>
      <span className="avatar-fallback" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>
      <img
        src={jobImageUrls[`./assets/jobs/${job.file}`]}
        alt={`Ícone de grupo da classe ${job.name} de Ragnarok`}
        onError={(event) => { event.currentTarget.hidden = true }}
      />
    </span>
  )
}

function CharacterDialog({ character, today, onClose, onSave }) {
  const [name, setName] = useState(character?.name || '')
  const [jobFile, setJobFile] = useState(() => resolveJobFile(character?.jobFile))
  const [lastDoneDate, setLastDoneDate] = useState(character?.lastDoneDate || '')

  function handleSubmit(event) {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return
    onSave({ id: character?.id || crypto.randomUUID(), name: trimmedName, jobFile, lastDoneDate: lastDoneDate || null })
  }

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="character-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <div className="dialog-heading">
          <div><span className="eyebrow">PERSONAGEM</span><h2 id="dialog-title">{character ? 'Editar personagem' : 'Adicionar personagem'}</h2></div>
          <button className="icon-button" type="button" aria-label="Fechar" onClick={onClose}><X size={19} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="character-name">Nome</label>
          <input autoFocus id="character-name" maxLength={32} placeholder="Ex.: Lunaria" required value={name} onChange={(event) => setName(event.target.value)} />
          <span className="field-label icon-field-label">Classe</span>
          <div className="icon-picker" role="group" aria-label="Escolher ícone do personagem">
            {jobClasses.map((job) => (
              <button aria-label={job.name} aria-pressed={jobFile === job.file} className={`icon-choice${jobFile === job.file ? ' selected' : ''}`} key={job.file} onClick={() => setJobFile(job.file)} title={job.name} type="button">
                <Avatar jobFile={job.file} name={job.name} />
                <span className="icon-choice-label">{job.name}</span>
              </button>
            ))}
          </div>
          <label className="field-label" htmlFor="last-tower-date">Última torre (opcional)</label>
          <input id="last-tower-date" max={today} type="date" value={lastDoneDate || ''} onChange={(event) => setLastDoneDate(event.target.value)} />
          <p className="field-hint">Disponível novamente às 04:00, após três viradas.</p>
          <div className="dialog-actions">
            <button className="button button-quiet" onClick={onClose} type="button">Cancelar</button>
            <button className="button button-primary" type="submit">{character ? 'Salvar alterações' : 'Adicionar personagem'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function CharacterRow({ character, now, onRecord, onEdit, onDelete }) {
  const availableAt = character.lastDoneDate ? getNextAvailableAt(character.lastDoneDate) : null
  const ready = !availableAt || now >= availableAt.getTime()
  const countdown = availableAt ? formatCountdown(availableAt, now) : null
  return (
    <article className="character-row">
      <Avatar jobFile={character.jobFile} name={character.name} large />
      <div className="character-identity">
        <h3>{character.name}</h3>
        <span>{jobClasses.find((job) => job.file === resolveJobFile(character.jobFile))?.name || 'Cavaleiros Rúnicos'} <span className="dot-separator">·</span> {character.lastDoneDate ? `Última torre ${formatShortDate(character.lastDoneDate)}` : 'Sem registro ainda'}</span>
      </div>
      <div className={`availability${ready ? ' is-ready' : ''}`} aria-live="polite">
        <span className="status-label"><i />{ready ? 'Disponível' : 'Em recarga'}</span>
        <span className="countdown">{ready ? 'Pronta para subir' : countdown}</span>
        {!ready && <span className="available-date">Volta {formatShortDate(availableAt)}</span>}
      </div>
      <button className={`button record-button${ready ? '' : ' record-disabled'}`} disabled={!ready} onClick={() => onRecord(character.id)} title={ready ? 'Registrar torre feita hoje' : 'A torre ainda está em recarga'} type="button">
        <Check size={16} strokeWidth={2.5} /> Fiz minha torre hoje
      </button>
      <div className="row-tools">
        <button className="icon-button" aria-label={`Editar ${character.name}`} onClick={() => onEdit(character)} type="button"><Pencil size={16} /></button>
        <button className="icon-button delete-button" aria-label={`Remover ${character.name}`} onClick={() => onDelete(character.id)} type="button"><Trash2 size={16} /></button>
      </div>
    </article>
  )
}

function App() {
  const [characters, setCharacters] = useState([])
  const [dialogCharacter, setDialogCharacter] = useState(undefined)
  const [now, setNow] = useState(Date.now)
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'light')
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured)
  const [charactersLoadedFor, setCharactersLoadedFor] = useState(null)
  const [appError, setAppError] = useState('')
  const [localImportAvailable, setLocalImportAvailable] = useState(false)

  useEffect(() => { localStorage.setItem(THEME_KEY, theme) }, [theme])
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined

    let active = true
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error) setAppError(error.message)
      setSession(data.session)
      setAuthReady(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (!nextSession) {
        setCharacters([])
        setLocalImportAvailable(false)
        setCharactersLoadedFor(null)
      }
      setAuthReady(true)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!session?.user.id) {
      return undefined
    }

    let active = true
    supabase
      .from('tower_characters')
      .select('id, name, job_file, last_done_date')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          setAppError(error.code === 'PGRST205'
            ? 'A tabela do elenco ainda não foi criada no Supabase. Execute supabase/migrations/20261019000000_create_tower_characters.sql no SQL Editor.'
            : error.message)
          setCharacters([])
          setLocalImportAvailable(false)
        } else {
          setCharacters((data || []).map(mapDatabaseCharacter))
          setLocalImportAvailable((data || []).length === 0 && readCharacters().length > 0)
        }
        setCharactersLoadedFor(session.user.id)
      })

    return () => { active = false }
  }, [session?.user.id])

  const readyCount = characters.filter((character) => !character.lastDoneDate || now >= getNextAvailableAt(character.lastDoneDate).getTime()).length
  const charactersLoading = Boolean(session?.user.id && charactersLoadedFor !== session.user.id)

  async function authenticate({ mode, email, password }) {
    if (!supabase) throw new Error('O Supabase não está configurado neste app.')
    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      })
      if (error) throw error
      return data.session ? 'Conta criada. Você já pode organizar seus personagens.' : 'Conta criada. Confira seu e-mail para confirmar o cadastro e entrar.'
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return 'Login realizado.'
  }

  async function saveCharacter(updatedCharacter) {
    setAppError('')
    const { data, error } = await supabase
      .from('tower_characters')
      .upsert({
        id: updatedCharacter.id,
        user_id: session.user.id,
        name: updatedCharacter.name,
        job_file: updatedCharacter.jobFile,
        last_done_date: updatedCharacter.lastDoneDate,
      })
      .select('id, name, job_file, last_done_date')
      .single()
    if (error) {
      setAppError(error.message)
      return
    }
    const savedCharacter = mapDatabaseCharacter(data)
    setCharacters((current) => {
      const exists = current.some((character) => character.id === savedCharacter.id)
      return exists
        ? current.map((character) => character.id === savedCharacter.id ? savedCharacter : character)
        : [...current, savedCharacter]
    })
    setDialogCharacter(undefined)
  }

  async function deleteCharacter(id) {
    const { error } = await supabase.from('tower_characters').delete().eq('id', id).eq('user_id', session.user.id)
    if (error) {
      setAppError(error.message)
      return
    }
    setCharacters((current) => current.filter((character) => character.id !== id))
  }

  async function recordTower(id) {
    const gameDate = getGameDate(new Date())
    const { data, error } = await supabase
      .from('tower_characters')
      .update({ last_done_date: gameDate })
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select('id, name, job_file, last_done_date')
      .single()
    if (error) {
      setAppError(error.message)
      return
    }
    const savedCharacter = mapDatabaseCharacter(data)
    setCharacters((current) => current.map((character) => character.id === id ? savedCharacter : character))
  }

  async function importLocalCharacters() {
    const localCharacters = readCharacters()
    if (!localCharacters.length) {
      setLocalImportAvailable(false)
      return
    }
    const rows = localCharacters.map((character) => ({
      user_id: session.user.id,
      name: character.name,
      job_file: resolveJobFile(character.jobFile),
      last_done_date: character.lastDoneDate || null,
    }))
    const { data, error } = await supabase
      .from('tower_characters')
      .insert(rows)
      .select('id, name, job_file, last_done_date')
    if (error) {
      setAppError(error.message)
      return
    }
    setCharacters((data || []).map(mapDatabaseCharacter))
    setLocalImportAvailable(false)
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) setAppError(error.message)
  }

  if (!authReady) {
    return <main className="app-shell auth-shell" data-theme={theme}><div className="auth-loading">Conectando à sua conta...</div></main>
  }

  if (!isSupabaseConfigured) {
    return <main className="app-shell auth-shell" data-theme={theme}><section className="auth-config-error"><h1>Supabase não configurado</h1><p>Configure SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY no arquivo .env e reinicie o Vite.</p></section></main>
  }

  if (!session) {
    return <AuthScreen theme={theme} onToggleTheme={() => setTheme((current) => current === 'light' ? 'dark' : 'light')} onAuthenticate={authenticate} />
  }

  return (
    <main className="app-shell" data-theme={theme}>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Torre de Prontera, início">
          <span className="brand-mark"><span /><span /><span /></span>
          <span className="brand-name">TORRE <b>DE PRONTERA</b></span>
        </a>
        <div className="topbar-right">
          <span className="reset-note"><Clock3 size={14} /> Reset diário <b>04:00</b></span>
          <span className="account-email">{session.user.email}</span>
          <button className="icon-button signout-button" type="button" aria-label="Sair da conta" title="Sair" onClick={signOut}><LogOut size={16} /></button>
          <button className="theme-toggle" type="button" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'} title={theme === 'light' ? 'Modo escuro' : 'Modo claro'}>
            {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
          </button>
        </div>
      </header>

      <div className="page-content" id="top">
        <section className="intro-section">
          <div className="intro-copy">
            <span className="eyebrow"><span className="eyebrow-line" /> SEU QUADRO DE TORRES</span>
            <h1>Uma torre de cada vez<span>.</span></h1>
            <p>Acompanhe o tempo de cada personagem e saiba quando voltar a subir.</p>
          </div>
          <div className="reset-card">
            <span className="reset-card-icon"><CalendarDays size={18} /></span>
            <span><b>Próximo reset</b><small>Todos os dias às 04:00</small></span>
            <span className="reset-time">04<span>:</span>00</span>
          </div>
        </section>

        <section className="roster-section" aria-labelledby="roster-title">
          <div className="roster-heading">
            <div><span className="eyebrow">SEU ESQUADRÃO</span><h2 id="roster-title">Personagens <span className="roster-count">{characters.length}</span></h2></div>
            <button className="button button-primary add-button" onClick={() => setDialogCharacter(null)} type="button"><Plus size={17} strokeWidth={2.5} /> Adicionar personagem</button>
          </div>
          <div className="stats-strip" aria-label="Resumo dos personagens">
            <div className="stat-item"><span className="stat-number">{characters.length.toString().padStart(2, '0')}</span><span className="stat-label">No esquadrão</span></div>
            <span className="stat-divider" />
            <div className="stat-item"><span className="stat-number ready-number">{readyCount.toString().padStart(2, '0')}</span><span className="stat-label">Torres disponíveis</span></div>
            <div className="stat-footnote"><span className="live-indicator" /> Atualizado em tempo real</div>
          </div>

          {appError && <p className="app-alert" role="alert">{appError}</p>}
          {localImportAvailable && <div className="import-notice">
            <p>Há personagens salvos neste navegador. Quer importá-los para esta conta?</p>
            <div>
              <button className="button button-primary" disabled={charactersLoading} onClick={importLocalCharacters} type="button">Importar personagens</button>
              <button className="button button-quiet" onClick={() => setLocalImportAvailable(false)} type="button">Agora não</button>
            </div>
          </div>}

          {charactersLoading ? <div className="roster-loading">Carregando seus personagens...</div> : characters.length > 0 ? (
            <div className="character-list">
              <div className="list-header"><span>PERSONAGEM</span><span>STATUS DA TORRE</span><span>AÇÃO</span></div>
              {characters.map((character) => (
                <CharacterRow character={character} key={character.id} now={now}
                  onDelete={deleteCharacter}
                  onEdit={setDialogCharacter} onRecord={recordTower} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-art" aria-hidden="true"><span className="empty-tower tower-back" /><span className="empty-tower tower-front" /><span className="empty-spark spark-one">✦</span><span className="empty-spark spark-two">✧</span></div>
              <h3>Seu próximo aventureiro começa aqui</h3>
              <p>Adicione um personagem para acompanhar a próxima torre.</p>
              <button className="button button-outline" onClick={() => setDialogCharacter(null)} type="button"><Plus size={16} /> Adicionar primeiro personagem</button>
            </div>
          )}
        </section>
        <footer className="page-footer"><span>TORRE DE PRONTERA</span><span>Personagens sincronizados com sua conta.</span></footer>
      </div>
      {dialogCharacter !== undefined && <CharacterDialog character={dialogCharacter} today={toDateInputValue(new Date(now))} onClose={() => setDialogCharacter(undefined)} onSave={saveCharacter} />}
    </main>
  )
}

export default App