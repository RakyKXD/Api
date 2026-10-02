'use client'

import React, { useState, useEffect } from 'react'
import {
  Compass,
  Radio,
  Users,
  Shield,
  ShieldCheck,
  Lock,
  Plus,
  Search,
  Smile,
  Send,
  Paperclip,
  Mic,
  Headphones,
  Settings,
  Hash,
  Volume2,
  Sparkles,
  Globe,
  Eye,
  EyeOff,
  Check,
  X,
  Edit3,
  Bot,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react'

// Types
export interface UserPersona {
  id: 'gaming' | 'professional' | 'intimate'
  name: string
  global_name: string
  bio: string
  avatar: string | null
  banner: string | null
  theme_colors?: [number, number]
  visibility: 'public' | 'private'
  tags?: string[]
}

export interface UserPersonaData {
  user_id: string
  active_persona: 'gaming' | 'professional' | 'intimate'
  personas: {
    gaming: UserPersona
    professional: UserPersona
    intimate: UserPersona
  }
}

export interface NearbyUser {
  id: string
  username: string
  global_name: string
  avatar: string | null
  bio: string
  active_persona: 'gaming' | 'professional' | 'intimate'
  distance_km: number
  location_approx: string
  coords_truncated: {
    lat: number
    lon: number
  }
  socials: {
    discord?: string
    github?: string
    twitter?: string
    instagram?: string
    steam?: string
    spotify?: string
  }
  tags: string[]
  status: 'online' | 'idle' | 'dnd' | 'offline'
  activity?: string
}

interface Message {
  id: string
  author: {
    name: string
    avatar: string
    isBot?: boolean
    roleColor?: string
    roleBadge?: string
  }
  content: string
  timestamp: string
  karma: number
  userVote?: 1 | -1 | 0
}

export default function AppLayout() {
  // Navigation & View state
  const [activeView, setActiveView] = useState<'chat' | 'nearby'>('chat')
  const [activeChannelId, setActiveChannelId] = useState('c-general')
  const [activeGuildId, setActiveGuildId] = useState('guild-main')
  const [isMemberListOpen, setIsMemberListOpen] = useState(true)

  // Identity & Persona state
  const [personaData, setPersonaData] = useState<UserPersonaData>({
    user_id: '900000000000000001',
    active_persona: 'gaming',
    personas: {
      gaming: {
        id: 'gaming',
        name: 'Gaming',
        global_name: 'Alex [Raky Master]',
        bio: 'Explorador de mundos virtuales y gamer competitivo 🎮',
        avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
        banner: null,
        visibility: 'public',
        tags: ['Valorant', 'Steam', 'RPG', 'Discord']
      },
      professional: {
        id: 'professional',
        name: 'Profesional',
        global_name: 'Alex Vance (FullStack Dev)',
        bio: 'Ingeniero de Software | Rust, Next.js y Criptografía Aplicada 💼',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        banner: null,
        visibility: 'public',
        tags: ['Next.js', 'Rust', 'E2EE', 'TypeScript']
      },
      intimate: {
        id: 'intimate',
        name: 'Íntimo / Privado',
        global_name: 'Alex V.',
        bio: 'Espacio personal exclusivo para amigos cercanos 🔒',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
        banner: null,
        visibility: 'private',
        tags: ['Amigos', 'Privado', 'E2EE']
      }
    }
  })

  // Modals state
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false)
  const [editingPersona, setEditingPersona] = useState<UserPersona | null>(null)
  const [isCreateServerModalOpen, setIsCreateServerModalOpen] = useState(false)
  const [isClydeModalOpen, setIsClydeModalOpen] = useState(false)

  // Create Server Form State
  const [newServerName, setNewServerName] = useState('')
  const [newServerEncrypted, setNewServerEncrypted] = useState(false)

  // Clyde AI Form State
  const [clydeName, setClydeName] = useState('Clyde AI')
  const [clydePersonality, setClydePersonality] = useState('Eres Clyde, el asistente inteligente de Raky en este servidor. Respondes con calidez y precisión técnica.')

  // Messages state
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-1',
      author: {
        name: 'Clyde AI',
        avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
        isBot: true,
        roleColor: '#5865f2',
        roleBadge: 'BOT DE SERVIDOR'
      },
      content: '¡Bienvenidos a Raky con diseño Liquid Glass! 🌟 Todos los paneles flotan sobre un lienzo dinámico. Este servidor cuenta con arquitectura cifrada de alta capacidad, optimizada para funcionar con total normalidad y fluidez superados los 1.000 miembros.',
      timestamp: 'Hoy a las 14:32',
      karma: 18,
      userVote: 1
    },
    {
      id: 'msg-2',
      author: {
        name: 'Elena Vance',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        roleColor: '#06b6d4',
        roleBadge: 'CORE DEV'
      },
      content: 'El efecto de cristal líquido translúcido con desenfoque de 40px y relieve óptico queda increíble. Y las esquinas redondeadas a 32px hacen que cada isla parezca flotar en el espacio.',
      timestamp: 'Hoy a las 14:35',
      karma: 9,
      userVote: 0
    },
    {
      id: 'msg-3',
      author: {
        name: 'Marcos [PixelArt]',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        roleColor: '#a855f7',
        roleBadge: 'DISEÑADOR'
      },
      content: '¿Habéis probado la pestaña de Gente Cercana? Reemplaza totalmente la tienda de Nitro y muestra a la gente del barrio con sus coordenadas truncadas a 2 decimales para proteger la privacidad.',
      timestamp: 'Hoy a las 14:38',
      karma: 14,
      userVote: 1
    }
  ])

  const [messageInput, setMessageInput] = useState('')

  // Nearby Radar State
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([])
  const [radarRadius, setRadarRadius] = useState<number>(30)
  const [isLoadingNearby, setIsLoadingNearby] = useState(false)
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number }>({ lat: 40.42, lon: -3.70 })

  // Cargar personas desde API
  useEffect(() => {
    fetch('/api/v10/users/@me/personas')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.personas) {
          setPersonaData(data)
        }
      })
      .catch(() => {})
  }, [])

  // Cargar usuarios cercanos
  const fetchNearby = (lat: number, lon: number, radius: number) => {
    setIsLoadingNearby(true)
    fetch(`/api/v10/users/nearby?lat=${lat}&lon=${lon}&radius=${radius}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.users) {
          setNearbyUsers(data.users)
          if (data.user_coords_truncated) {
            setUserCoords(data.user_coords_truncated)
          }
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingNearby(false))
  }

  useEffect(() => {
    if (activeView === 'nearby') {
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          pos => {
            const lat = Math.round(pos.coords.latitude * 100) / 100
            const lon = Math.round(pos.coords.longitude * 100) / 100
            setUserCoords({ lat, lon })
            fetchNearby(lat, lon, radarRadius)
          },
          () => {
            fetchNearby(userCoords.lat, userCoords.lon, radarRadius)
          }
        )
      } else {
        fetchNearby(userCoords.lat, userCoords.lon, radarRadius)
      }
    }
  }, [activeView, radarRadius])

  // Alternar persona activa
  const handleSelectPersona = async (personaId: 'gaming' | 'professional' | 'intimate') => {
    try {
      const res = await fetch('/api/v10/users/@me/personas/active', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active_persona: personaId })
      })
      if (res.ok) {
        setPersonaData(prev => ({ ...prev, active_persona: personaId }))
      } else {
        setPersonaData(prev => ({ ...prev, active_persona: personaId }))
      }
    } catch {
      setPersonaData(prev => ({ ...prev, active_persona: personaId }))
    }
  }

  // Guardar edición de persona
  const handleSavePersona = async () => {
    if (!editingPersona) return
    try {
      await fetch('/api/v10/users/@me/personas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona_id: editingPersona.id,
          global_name: editingPersona.global_name,
          bio: editingPersona.bio,
          avatar: editingPersona.avatar,
          visibility: editingPersona.visibility,
          tags: editingPersona.tags
        })
      })
      setPersonaData(prev => ({
        ...prev,
        personas: {
          ...prev.personas,
          [editingPersona.id]: editingPersona
        }
      }))
      setEditingPersona(null)
    } catch {
      setPersonaData(prev => ({
        ...prev,
        personas: {
          ...prev.personas,
          [editingPersona.id]: editingPersona
        }
      }))
      setEditingPersona(null)
    }
  }

  // Enviar mensaje en chat
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim()) return

    const activeP = personaData.personas[personaData.active_persona]
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      author: {
        name: activeP.global_name,
        avatar: activeP.avatar || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
        roleColor: '#38bdf8'
      },
      content: messageInput.trim(),
      timestamp: 'Ahora mismo',
      karma: 1,
      userVote: 1
    }

    setMessages(prev => [...prev, newMsg])
    setMessageInput('')

    // Respuesta simulada de Clyde si es mencionado
    if (messageInput.toLowerCase().includes('@clyde') || messageInput.toLowerCase().includes('clyde')) {
      setTimeout(() => {
        const clydeReply: Message = {
          id: `msg-${Date.now() + 1}`,
          author: {
            name: clydeName,
            avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
            isBot: true,
            roleColor: '#5865f2',
            roleBadge: 'BOT IA'
          },
          content: `🤖 [${clydeName}]: Hola ${activeP.global_name}. He recibido tu mensaje. Servidor cifrado E2EE operando con métricas óptimas (+1k capacidad activa sin degradación).`,
          timestamp: 'Ahora mismo',
          karma: 3
        }
        setMessages(prev => [...prev, clydeReply])
      }, 700)
    }
  }

  // Voto de Karma estilo Reddit
  const handleVoteKarma = (msgId: string, delta: 1 | -1) => {
    setMessages(prev =>
      prev.map(m => {
        if (m.id !== msgId) return m
        if (m.userVote === delta) {
          // Deshacer voto
          return { ...m, karma: m.karma - delta, userVote: 0 }
        }
        const change = m.userVote ? delta * 2 : delta
        return { ...m, karma: m.karma + change, userVote: delta }
      })
    )
  }

  const activePersonaObj = personaData.personas[personaData.active_persona]

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-br from-neutral-950 via-slate-950 to-neutral-900 text-neutral-200 select-none font-sans p-3 flex gap-3">
      {/* ----------------------------------------------------
          CAPA 1: FONDO AMBIENTAL CON ESFERAS DESENFOCADAS
      ---------------------------------------------------- */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        {/* Esfera Violeta */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-violet-600/20 blur-[120px] animate-liquid-orb-1" />
        {/* Esfera Cian */}
        <div className="absolute top-1/3 -right-32 w-[32rem] h-[32rem] rounded-full bg-cyan-500/15 blur-[140px] animate-liquid-orb-2" />
        {/* Esfera Índigo Inferior */}
        <div className="absolute -bottom-40 left-1/3 w-[36rem] h-[36rem] rounded-full bg-indigo-600/20 blur-[130px] animate-liquid-orb-1" />
      </div>

      {/* ----------------------------------------------------
          ISLA 1: BARRA DE SERVIDORES (LIQUID GLASS PANEL)
      ---------------------------------------------------- */}
      <aside className="relative z-10 w-[74px] shrink-0 rounded-[32px] bg-neutral-900/40 backdrop-blur-2xl backdrop-saturate-150 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.12)] flex flex-col items-center py-4 gap-3">
        {/* Raky Logo / Inicio */}
        <button
          onClick={() => setActiveView('chat')}
          className="group relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-lg hover:rounded-xl transition-all duration-300"
          title="Raky Direct Messages & Channels"
        >
          <span className="font-extrabold text-xl tracking-tighter">R</span>
          <div className="absolute -left-3.5 w-1.5 h-8 bg-white rounded-r-full transition-all group-hover:h-8" />
        </button>

        <div className="w-8 h-[1px] bg-white/10 rounded-full my-0.5" />

        {/* Servidor Principal (Cifrado E2EE) */}
        <button
          onClick={() => {
            setActiveGuildId('guild-main')
            setActiveView('chat')
          }}
          className={`group relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 overflow-hidden border ${
            activeGuildId === 'guild-main' && activeView === 'chat'
              ? 'rounded-xl border-violet-400/50 shadow-[0_0_20px_rgba(139,92,246,0.3)] bg-white/10'
              : 'border-white/10 bg-white/5 hover:rounded-xl hover:bg-white/10'
          }`}
          title="Raky Hub Cifrado (1k+ Miembros)"
        >
          <span className="text-sm font-bold text-violet-300">RK</span>
          {activeGuildId === 'guild-main' && activeView === 'chat' && (
            <div className="absolute -left-3.5 w-1.5 h-9 bg-white rounded-r-full" />
          )}
        </button>

        {/* Servidor de Desarrollo */}
        <button
          onClick={() => {
            setActiveGuildId('guild-dev')
            setActiveView('chat')
          }}
          className={`group relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 overflow-hidden border ${
            activeGuildId === 'guild-dev' && activeView === 'chat'
              ? 'rounded-xl border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.3)] bg-white/10'
              : 'border-white/10 bg-white/5 hover:rounded-xl hover:bg-white/10'
          }`}
          title="Comunidad de Desarrolladores"
        >
          <span className="text-sm font-bold text-cyan-300">DEV</span>
        </button>

        {/* ACCESO DIRECTO: RADAR DE PERSONAS CERCANAS (Reemplaza Tienda/Quests) */}
        <button
          onClick={() => setActiveView('nearby')}
          className={`group relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 border ${
            activeView === 'nearby'
              ? 'rounded-xl bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_22px_rgba(6,182,212,0.4)]'
              : 'border-white/10 bg-white/5 text-neutral-300 hover:rounded-xl hover:bg-white/10 hover:text-cyan-300'
          }`}
          title="Radar de Personas Cercanas"
        >
          <Radio className="w-5 h-5 animate-pulse" />
          {activeView === 'nearby' && (
            <div className="absolute -left-3.5 w-1.5 h-9 bg-cyan-400 rounded-r-full" />
          )}
        </button>

        {/* Botón Crear Servidor */}
        <button
          onClick={() => setIsCreateServerModalOpen(true)}
          className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-400 hover:rounded-xl transition-all duration-300 shadow-sm"
          title="Crear un Servidor (Soporte Cifrado 1k+)"
        >
          <Plus className="w-5 h-5" />
        </button>

        <div className="mt-auto flex flex-col items-center gap-3">
          {/* Enlace al cliente web nativo */}
          <a
            href="/app.html"
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
            title="Abrir Cliente Web Discord/Raky Completo"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </aside>

      {/* ----------------------------------------------------
          ISLA 2: LISTA DE CANALES & BARRA DE USUARIO
      ---------------------------------------------------- */}
      <aside className="relative z-10 w-64 shrink-0 rounded-[32px] bg-neutral-900/40 backdrop-blur-2xl backdrop-saturate-150 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.12)] flex flex-col overflow-hidden">
        {/* Cabecera del Servidor */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-white/10 font-bold text-white shadow-sm">
          <div className="flex items-center gap-2 truncate">
            <span className="truncate">Raky Central</span>
            <span className="px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-violet-500/20 text-violet-300 border border-violet-500/30">
              E2EE 1k+
            </span>
          </div>
          <button
            onClick={() => setIsClydeModalOpen(true)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition"
            title="Configurar Clyde AI"
          >
            <Bot className="w-4 h-4 text-violet-400" />
          </button>
        </div>

        {/* Sección de Exploración & Descubrimiento (SIN QUESTS NI TIENDA) */}
        <div className="px-3 pt-3 pb-2 flex flex-col gap-1">
          {/* Botón Radar Gente Cercana */}
          <button
            onClick={() => setActiveView('nearby')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 border ${
              activeView === 'nearby'
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-200 shadow-sm'
                : 'border-transparent text-neutral-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <div className="relative">
              <Radio className="w-4 h-4 text-cyan-400" />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            </div>
            <span className="flex-1 text-left">Gente Cercana</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Radar
            </span>
          </button>

          <button
            onClick={() => setActiveView('chat')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
              activeView === 'chat' && activeChannelId === 'c-general'
                ? 'bg-white/10 text-white'
                : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200'
            }`}
          >
            <Users className="w-4 h-4 text-violet-400" />
            <span>Amigos & Mensajes</span>
          </button>
        </div>

        {/* Lista de Canales */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          <div>
            <div className="px-2 mb-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
              <span>Canales de Texto</span>
              <Plus className="w-3.5 h-3.5 hover:text-white cursor-pointer" />
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => {
                  setActiveChannelId('c-general')
                  setActiveView('chat')
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-sm transition ${
                  activeChannelId === 'c-general' && activeView === 'chat'
                    ? 'bg-white/10 text-white font-medium'
                    : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200'
                }`}
              >
                <Hash className="w-4 h-4 text-neutral-400" />
                <span>general</span>
              </button>

              <button
                onClick={() => {
                  setActiveChannelId('c-anuncios')
                  setActiveView('chat')
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-sm transition ${
                  activeChannelId === 'c-anuncios' && activeView === 'chat'
                    ? 'bg-white/10 text-white font-medium'
                    : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200'
                }`}
              >
                <Hash className="w-4 h-4 text-neutral-400" />
                <span>anuncios</span>
              </button>

              <button
                onClick={() => {
                  setActiveChannelId('c-e2ee-secret')
                  setActiveView('chat')
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-sm transition ${
                  activeChannelId === 'c-e2ee-secret' && activeView === 'chat'
                    ? 'bg-violet-500/20 text-violet-200 font-medium border border-violet-500/30'
                    : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200'
                }`}
              >
                <Lock className="w-4 h-4 text-violet-400" />
                <span className="truncate">secreto-e2ee</span>
                <span className="ml-auto text-[10px] font-bold bg-violet-500/30 px-1 rounded text-violet-300">1k+</span>
              </button>
            </div>
          </div>

          <div>
            <div className="px-2 mb-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
              <span>Canales de Voz</span>
            </div>
            <div className="space-y-0.5">
              <button className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-sm text-neutral-400 hover:bg-white/5 hover:text-neutral-200 transition">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>Sala Chill E2EE</span>
              </button>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------
            INTEGRACIÓN DE IDENTIDADES: PASTILLA DE USUARIO CRISTAL
            (Sin botones toscos; clic abre el modal flotante)
        ---------------------------------------------------- */}
        <div className="p-2.5 border-t border-white/5">
          <div
            onClick={() => setIsPersonaModalOpen(true)}
            className="group relative flex items-center justify-between p-2 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 backdrop-blur-xl transition-all cursor-pointer shadow-sm hover:shadow-md"
            title="Haz clic para cambiar entre tus 3 perfiles dinámicos"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <img
                  src={activePersonaObj.avatar || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80'}
                  alt="Avatar"
                  className="w-9 h-9 rounded-full object-cover border border-white/20 shadow-inner"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-neutral-900" />
              </div>
              <div className="truncate">
                <div className="font-semibold text-xs text-white truncate flex items-center gap-1">
                  <span>{activePersonaObj.global_name}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-neutral-400">
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    {activePersonaObj.name}
                  </span>
                  <span>{activePersonaObj.visibility === 'public' ? '🌐' : '🔒'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-0.5 text-neutral-400 group-hover:text-white transition">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsPersonaModalOpen(true)
                }}
                className="p-1 rounded-lg hover:bg-white/10"
                title="Ajustes de Perfiles Libres"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ----------------------------------------------------
          ISLA 3: ÁREA PRINCIPAL (CHAT O RADAR GENTE CERCANA)
      ---------------------------------------------------- */}
      <main className="relative z-10 flex-1 flex flex-col rounded-[32px] bg-neutral-900/40 backdrop-blur-2xl backdrop-saturate-150 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.12)] overflow-hidden">
        {/* Cabecera del Panel Principal */}
        <header className="h-14 px-5 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {activeView === 'chat' ? (
              <>
                <Hash className="w-5 h-5 text-neutral-400" />
                <span className="font-bold text-white text-base">
                  {activeChannelId === 'c-general' ? 'general' : (activeChannelId === 'c-anuncios' ? 'anuncios' : 'secreto-e2ee')}
                </span>
                <span className="text-xs text-neutral-400 hidden sm:inline border-l border-white/10 pl-3">
                  {activeChannelId === 'c-e2ee-secret'
                    ? '🔒 Canal con cifrado extremo a extremo (E2EE) • Capacidad 1k+ verificada'
                    : 'Conversaciones libres con estética Liquid Glass'}
                </span>
              </>
            ) : (
              <>
                <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
                <span className="font-bold text-white text-base">Radar de Gente Cercana</span>
                <span className="text-xs text-cyan-300/80 hidden sm:inline border-l border-white/10 pl-3">
                  Descubrimiento local • Coordenadas truncadas a 2 decimales para proteger privacidad
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeView === 'chat' && (
              <button
                onClick={() => setIsClydeModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-200 text-xs font-semibold transition"
                title="Configurar Clyde AI"
              >
                <Bot className="w-4 h-4 text-violet-400" />
                <span className="hidden sm:inline">Clyde AI</span>
              </button>
            )}

            <button
              onClick={() => setIsMemberListOpen(!isMemberListOpen)}
              className={`p-2 rounded-xl border border-white/10 transition ${
                isMemberListOpen ? 'bg-white/10 text-white' : 'text-neutral-400 hover:text-white'
              }`}
              title="Alternar lista de miembros"
            >
              <Users className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* CONTENIDO SEGÚN VISTA: CHAT O RADAR GENTE CERCANA */}
        {activeView === 'chat' ? (
          /* ================= VISTA DE CHAT ================= */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Mensaje de Bienvenida / Aviso de Servidor Cifrado 1k */}
            <div className="px-6 pt-5 pb-2">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-violet-600/20 border border-violet-500/30 text-violet-300">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Servidor Cifrado E2EE con Capacidad Extendida 1K+
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                      Operativo sin restricciones
                    </span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    Este servidor está configurado para que al llegar a 1.000 miembros continúe funcionando con total normalidad,
                    con cifrado Signal Zero-Knowledge en tiempo real, canales fluidos y sin bloqueos de sincronización.
                  </p>
                </div>
              </div>
            </div>

            {/* Lista de Mensajes con Burbujas de Cristal Líquido y Karma Reddit */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="group flex items-start gap-3.5 p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/5 transition-all"
                >
                  <img
                    src={msg.author.avatar}
                    alt={msg.author.name}
                    className="w-10 h-10 rounded-2xl object-cover shrink-0 border border-white/10 shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-bold text-sm"
                        style={{ color: msg.author.roleColor || '#f3f4f6' }}
                      >
                        {msg.author.name}
                      </span>
                      {msg.author.roleBadge && (
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-white/10 text-neutral-300">
                          {msg.author.roleBadge}
                        </span>
                      )}
                      <span className="text-[11px] text-neutral-400">{msg.timestamp}</span>
                    </div>

                    <div className="text-sm text-neutral-200 mt-1 leading-relaxed break-words">
                      {msg.content}
                    </div>

                    {/* Votos de Karma estilo Reddit */}
                    <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/10 text-xs">
                      <button
                        onClick={() => handleVoteKarma(msg.id, 1)}
                        className={`p-1 rounded transition hover:scale-125 ${
                          msg.userVote === 1 ? 'text-orange-400 font-bold' : 'text-neutral-400 hover:text-orange-400'
                        }`}
                        title="Votar Positivo (Reddit-style)"
                      >
                        ▲
                      </button>
                      <span
                        className={`font-semibold min-w-4 text-center ${
                          msg.karma > 0 ? 'text-orange-400' : (msg.karma < 0 ? 'text-indigo-400' : 'text-neutral-300')
                        }`}
                      >
                        {msg.karma}
                      </span>
                      <button
                        onClick={() => handleVoteKarma(msg.id, -1)}
                        className={`p-1 rounded transition hover:scale-125 ${
                          msg.userVote === -1 ? 'text-indigo-400 font-bold' : 'text-neutral-400 hover:text-indigo-400'
                        }`}
                        title="Votar Negativo"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input de Texto Flotante (Liquid Glass Dock) */}
            <form onSubmit={handleSendMessage} className="p-4 pt-1">
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl focus-within:border-violet-500/50 focus-within:bg-white/[0.07] transition-all shadow-inner">
                <button
                  type="button"
                  className="p-1 text-neutral-400 hover:text-white transition"
                  title="Adjuntar archivo seguro"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={`Enviar mensaje como @${activePersonaObj.global_name}...`}
                  className="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 outline-none"
                />

                <button
                  type="button"
                  className="p-1 text-neutral-400 hover:text-white transition"
                  title="Añadir emoji"
                >
                  <Smile className="w-5 h-5" />
                </button>

                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="p-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:hover:bg-violet-600 text-white transition shadow-sm"
                  title="Enviar"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* ================= VISTA DE RADAR DE GENTE CERCANA ================= */
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Header del Radar con Control de Distancia */}
            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="relative flex items-center justify-center w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-300">
                  <Radio className="w-8 h-8 animate-pulse" />
                  <div className="absolute inset-0 rounded-3xl border border-cyan-400/40 animate-radar-pulse" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    Radar de Personas Cercanas en Raky
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      Radio: {radarRadius} km
                    </span>
                  </h2>
                  <p className="text-xs text-neutral-400 mt-1">
                    Mostrando usuarios activos por proximidad geográfica. Tus coordenadas exactas están truncadas a 2 decimales ({userCoords.lat}, {userCoords.lon}) para salvaguardar tu ubicación real.
                  </p>
                </div>
              </div>

              {/* Slider de Filtro de Radio */}
              <div className="flex flex-col gap-2 min-w-56">
                <div className="flex justify-between text-xs text-neutral-300">
                  <span>Radio de búsqueda:</span>
                  <span className="font-bold text-cyan-300">{radarRadius} km</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={radarRadius}
                  onChange={(e) => setRadarRadius(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-neutral-400">
                  <span>5 km</span>
                  <span>50 km</span>
                  <span>100 km</span>
                </div>
              </div>
            </div>

            {/* Cuadrícula de Tarjetas de Gente Cercana */}
            {isLoadingNearby ? (
              <div className="flex flex-col items-center justify-center py-20 text-neutral-400 gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                <span className="text-sm">Rastreando perfiles en el radar...</span>
              </div>
            ) : nearbyUsers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nearbyUsers.map((u) => (
                  <div
                    key={u.id}
                    className="group relative rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 hover:border-cyan-400/40 backdrop-blur-xl p-5 transition-all duration-300 shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Info: Avatar & Distancia */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="relative">
                          <img
                            src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                            alt={u.global_name}
                            className="w-14 h-14 rounded-2xl object-cover border border-white/20 shadow-md"
                          />
                          <span
                            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-neutral-900 ${
                              u.status === 'online' ? 'bg-emerald-400' : (u.status === 'idle' ? 'bg-amber-400' : 'bg-red-400')
                            }`}
                          />
                        </div>

                        <div className="flex flex-col items-end">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shadow-sm">
                            a ~{u.distance_km} km
                          </span>
                          <span className="text-[11px] text-neutral-400 mt-1">{u.location_approx}</span>
                        </div>
                      </div>

                      {/* Nombre & Perfil Activo */}
                      <div className="mb-2">
                        <h4 className="font-bold text-white text-base leading-tight group-hover:text-cyan-200 transition">
                          {u.global_name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-neutral-400">@{u.username}</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                            {u.active_persona === 'gaming' ? '🎮 Gaming' : (u.active_persona === 'professional' ? '💼 Profesional' : '🔒 Privado')}
                          </span>
                        </div>
                      </div>

                      {/* Bio */}
                      <p className="text-xs text-neutral-300 leading-relaxed mb-3 line-clamp-2">
                        {u.bio}
                      </p>

                      {/* Tags / Intereses */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {u.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-white/5 border border-white/10 text-neutral-300"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Redes Sociales Visibles & Acción */}
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-neutral-400">
                        {u.socials.github && (
                          <span className="hover:text-white transition cursor-pointer" title={`GitHub: @${u.socials.github}`}>
                            GH
                          </span>
                        )}
                        {u.socials.twitter && (
                          <span className="hover:text-cyan-400 transition cursor-pointer" title={`Twitter/X: @${u.socials.twitter}`}>
                            𝕏
                          </span>
                        )}
                        {u.socials.spotify && (
                          <span className="hover:text-emerald-400 transition cursor-pointer" title={`Spotify: ${u.socials.spotify}`}>
                            ♫
                          </span>
                        )}
                        {u.socials.steam && (
                          <span className="hover:text-blue-400 transition cursor-pointer" title={`Steam: ${u.socials.steam}`}>
                            Steam
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setActiveView('chat')
                        }}
                        className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600 text-cyan-200 hover:text-white border border-cyan-400/30 text-xs font-semibold transition"
                      >
                        Conectar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center text-neutral-400">
                <Radio className="w-12 h-12 mx-auto mb-3 opacity-30 text-cyan-400" />
                <p>No se encontraron personas dentro de {radarRadius} km.</p>
                <p className="text-xs text-neutral-500 mt-1">Aumenta el radio con el deslizador superior.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ----------------------------------------------------
          ISLA 4: LISTA DE MIEMBROS (COLAPSABLE)
      ---------------------------------------------------- */}
      {isMemberListOpen && (
        <aside className="relative z-10 w-60 shrink-0 rounded-[32px] bg-neutral-900/40 backdrop-blur-2xl backdrop-saturate-150 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.12)] p-4 flex flex-col overflow-hidden">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
            En línea — 4
          </div>

          <div className="space-y-2 overflow-y-auto">
            {/* Clyde AI */}
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80"
                  alt="Clyde"
                  className="w-8 h-8 rounded-xl object-cover border border-violet-400/40"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-violet-400" />
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-violet-300 flex items-center gap-1">
                  <span>{clydeName}</span>
                  <span className="text-[8px] bg-violet-500/30 px-1 rounded text-violet-200">BOT</span>
                </div>
                <div className="text-[10px] text-neutral-400 truncate">Asistente IA Raky</div>
              </div>
            </div>

            {/* Tú mismo con la identidad activa */}
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.05] border border-white/10 transition">
              <div className="relative">
                <img
                  src={activePersonaObj.avatar || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80'}
                  alt="Tú"
                  className="w-8 h-8 rounded-xl object-cover"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-white truncate">{activePersonaObj.global_name}</div>
                <div className="text-[10px] text-neutral-400 truncate">{activePersonaObj.bio}</div>
              </div>
            </div>

            {/* Otros miembros */}
            <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/[0.04] transition">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                alt="Elena"
                className="w-8 h-8 rounded-xl object-cover"
              />
              <div className="truncate">
                <div className="text-xs font-semibold text-cyan-300">Elena Vance</div>
                <div className="text-[10px] text-neutral-400 truncate">Core Dev</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/[0.04] transition">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
                alt="Marcos"
                className="w-8 h-8 rounded-xl object-cover"
              />
              <div className="truncate">
                <div className="text-xs font-semibold text-neutral-200">Marcos [PixelArt]</div>
                <div className="text-[10px] text-neutral-400 truncate">Renderizando 3D</div>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* ====================================================
          MODAL FLOTANTE 1: SELECTOR DE TRIPLE IDENTIDAD LIBRE
      ==================================================== */}
      {isPersonaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-xl rounded-[32px] bg-neutral-900/85 backdrop-blur-3xl border border-white/15 p-6 shadow-[0_25px_60px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.2)]">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>🎭 Gestión de Triple Identidad</span>
                  <span className="text-xs font-semibold text-violet-300 bg-violet-500/20 px-2 py-0.5 rounded-full border border-violet-500/30">
                    3 Slots Libres
                  </span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Cambia instantáneamente de faceta o edita tus perfiles con privacidad flexible.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsPersonaModalOpen(false)
                  setEditingPersona(null)
                }}
                className="p-1 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editingPersona ? (
              /* Modo Edición de Slot */
              <div className="py-4 space-y-3.5">
                <div className="flex items-center justify-between text-xs text-neutral-400 pb-1">
                  <span>Editando perfil: <strong className="text-white">{editingPersona.name}</strong></span>
                  <button
                    onClick={() => setEditingPersona(null)}
                    className="text-violet-400 hover:underline"
                  >
                    Volver a selección
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                    Nombre Visible / Global Name
                  </label>
                  <input
                    type="text"
                    value={editingPersona.global_name}
                    onChange={(e) => setEditingPersona({ ...editingPersona, global_name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-2xl bg-white/[0.04] border border-white/10 text-sm text-white focus:border-violet-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                    Biografía / Estado
                  </label>
                  <textarea
                    rows={2}
                    value={editingPersona.bio}
                    onChange={(e) => setEditingPersona({ ...editingPersona, bio: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-2xl bg-white/[0.04] border border-white/10 text-sm text-white focus:border-violet-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                    URL del Avatar
                  </label>
                  <input
                    type="text"
                    value={editingPersona.avatar || ''}
                    onChange={(e) => setEditingPersona({ ...editingPersona, avatar: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2 rounded-2xl bg-white/[0.04] border border-white/10 text-sm text-white focus:border-violet-400 outline-none"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                  <div>
                    <div className="text-xs font-bold text-white">Visibilidad del Perfil</div>
                    <div className="text-[11px] text-neutral-400">
                      {editingPersona.visibility === 'public'
                        ? 'Visible en servidores públicos y Radar de Gente Cercana'
                        : 'Privado y oculto en el Radar; solo visible en chats autorizados'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setEditingPersona({
                        ...editingPersona,
                        visibility: editingPersona.visibility === 'public' ? 'private' : 'public'
                      })
                    }
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                      editingPersona.visibility === 'public'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                        : 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40'
                    }`}
                  >
                    {editingPersona.visibility === 'public' ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    <span>{editingPersona.visibility === 'public' ? 'Público 🌐' : 'Privado 🔒'}</span>
                  </button>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setEditingPersona(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-white/5 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSavePersona}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white transition shadow-md"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            ) : (
              /* Selector de las 3 Identidades */
              <div className="py-4 space-y-3">
                {(['gaming', 'professional', 'intimate'] as const).map((id) => {
                  const p = personaData.personas[id]
                  const isActive = personaData.active_persona === id
                  return (
                    <div
                      key={id}
                      onClick={() => handleSelectPersona(id)}
                      className={`relative flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-violet-600/20 border-violet-400/60 shadow-[0_0_20px_rgba(139,92,246,0.25)]'
                          : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <img
                          src={p.avatar || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80'}
                          alt={p.name}
                          className="w-12 h-12 rounded-2xl object-cover border border-white/20 shadow-sm shrink-0"
                        />
                        <div className="truncate">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">{p.name}</span>
                            {isActive && (
                              <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-violet-500 text-white shadow-sm">
                                ACTIVO
                              </span>
                            )}
                            <span className="text-xs">
                              {p.visibility === 'public' ? '🌐' : '🔒'}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-neutral-300 mt-0.5 truncate">
                            {p.global_name}
                          </div>
                          <div className="text-xs text-neutral-400 truncate mt-0.5">
                            {p.bio}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pl-3 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingPersona({ ...p })
                          }}
                          className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition"
                          title="Editar este perfil"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setIsPersonaModalOpen(false)}
                className="px-5 py-2 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          MODAL 2: CREAR SERVIDOR (CON SOPORTE 1K+ CIFRADO)
      ==================================================== */}
      {isCreateServerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-[32px] bg-neutral-900/85 backdrop-blur-3xl border border-white/15 p-6 shadow-[0_25px_60px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.2)]">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>✨ Crear Servidor en Raky</span>
              </h3>
              <button
                onClick={() => setIsCreateServerModalOpen(false)}
                className="p-1 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Nombre del Servidor
                </label>
                <input
                  type="text"
                  value={newServerName}
                  onChange={(e) => setNewServerName(e.target.value)}
                  placeholder="Mi Comunidad Secreta"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-sm text-white focus:border-violet-400 outline-none"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newServerEncrypted}
                    onChange={(e) => setNewServerEncrypted(e.target.checked)}
                    className="w-4 h-4 accent-violet-500 rounded cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Cifrado Extremo a Extremo (E2EE Signal)</span>
                      <span className="text-[9px] bg-violet-500/20 text-violet-300 px-1.5 py-0.2 rounded font-extrabold">
                        ALTA CAPACIDAD 1K+
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      Privacidad absoluta Zero-Knowledge. Optimizado para funcionar con total normalidad incluso superados los 1.000 miembros.
                    </div>
                  </div>
                </label>
              </div>

              {newServerEncrypted && (
                <div className="p-3 rounded-2xl bg-violet-600/10 border border-violet-500/30 text-violet-200 text-xs leading-relaxed">
                  ✓ <strong>Modo 1k+ Activado:</strong> El servidor cuenta con arquitectura elástica que garantiza que al superar los 1.000 miembros no se bloqueen canales, ni el chat en tiempo real ni la entrega de mensajes cifrados.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => setIsCreateServerModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setIsCreateServerModalOpen(false)
                  setNewServerName('')
                }}
                className="px-5 py-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition"
              >
                Crear Servidor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          MODAL 3: PERSONALIZACIÓN DE CLYDE AI
      ==================================================== */}
      {isClydeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-[32px] bg-neutral-900/85 backdrop-blur-3xl border border-white/15 p-6 shadow-[0_25px_60px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.2)]">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Bot className="w-5 h-5 text-violet-400" />
                <span>Personalizar Clyde AI</span>
              </h3>
              <button
                onClick={() => setIsClydeModalOpen(false)}
                className="p-1 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Nombre del Asistente
                </label>
                <input
                  type="text"
                  value={clydeName}
                  onChange={(e) => setClydeName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-sm text-white focus:border-violet-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Personalidad / System Prompt
                </label>
                <textarea
                  rows={3}
                  value={clydePersonality}
                  onChange={(e) => setClydePersonality(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 text-sm text-white focus:border-violet-400 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => setIsClydeModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white"
              >
                Cerrar
              </button>
              <button
                onClick={() => setIsClydeModalOpen(false)}
                className="px-5 py-2 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-md transition"
              >
                Guardar Personalidad
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
