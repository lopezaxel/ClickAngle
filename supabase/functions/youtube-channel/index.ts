import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const YT_API_KEY = Deno.env.get('YOUTUBE_API_KEY')
const YT_BASE    = 'https://www.googleapis.com/youtube/v3'

// Fetches publicly-accessible thumbnail and converts to base64 for Gemini Vision
async function thumbnailToBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const buf = await res.arrayBuffer()
    const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)))
    return b64
  } catch {
    return null
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!YT_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'YOUTUBE_API_KEY no configurada en Supabase Secrets.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { handle, includeImages = true } = await req.json()

    if (!handle?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Falta el handle del canal (ej: @NombreCanal).' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── 1. Obtener info del canal ─────────────────────────────────────────
    const cleanHandle = handle.trim().replace(/^@/, '')
    const channelRes = await fetch(
      `${YT_BASE}/channels?part=snippet,statistics,brandingSettings&forHandle=${cleanHandle}&key=${YT_API_KEY}`
    )
    const channelData = await channelRes.json()

    if (!channelData.items?.length) {
      return new Response(
        JSON.stringify({ error: `Canal "@${cleanHandle}" no encontrado. Verificá el handle.` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const ch      = channelData.items[0]
    const chId    = ch.id
    const snippet = ch.snippet
    const stats   = ch.statistics

    // ── 2. Top videos por vistas ──────────────────────────────────────────
    // search.list cuesta 100 unidades — trae los más vistos del canal
    const searchRes = await fetch(
      `${YT_BASE}/search?part=snippet&channelId=${chId}&order=viewCount&maxResults=20&type=video&key=${YT_API_KEY}`
    )
    const searchData = await searchRes.json()
    const searchItems = searchData.items || []

    // ── 3. Stats de esos videos (1 unidad para hasta 50 videos) ──────────
    const videoIds = searchItems.map((v: any) => v.id?.videoId).filter(Boolean).join(',')
    let videoStats: Record<string, any> = {}
    if (videoIds) {
      const statsRes = await fetch(
        `${YT_BASE}/videos?part=statistics&id=${videoIds}&key=${YT_API_KEY}`
      )
      const statsData = await statsRes.json()
      for (const v of (statsData.items || [])) {
        videoStats[v.id] = v.statistics
      }
    }

    // ── 4. Construir lista de videos enriquecida ───────────────────────────
    const topVideos = searchItems.map((v: any) => {
      const vid = v.id?.videoId
      const s   = v.snippet
      const st  = videoStats[vid] || {}
      // Preferir maxres → high → medium
      const thumbUrl =
        s.thumbnails?.maxres?.url ||
        s.thumbnails?.high?.url   ||
        s.thumbnails?.medium?.url || ''
      return {
        id:           vid,
        title:        s.title,
        description:  s.description?.slice(0, 200),
        publishedAt:  s.publishedAt,
        thumbnailUrl: thumbUrl,
        viewCount:    parseInt(st.viewCount  || '0'),
        likeCount:    parseInt(st.likeCount  || '0'),
        commentCount: parseInt(st.commentCount || '0'),
      }
    }).sort((a: any, b: any) => b.viewCount - a.viewCount)  // garantizar orden por vistas

    // ── 5. Convertir top 7 miniaturas a base64 para Gemini Vision ─────────
    let thumbnailImages: Array<{ title: string; views: number; base64: string }> = []

    if (includeImages) {
      const top7 = topVideos.slice(0, 7)
      const b64Results = await Promise.all(
        top7.map(async (v: any) => ({
          title:  v.title,
          views:  v.viewCount,
          base64: v.thumbnailUrl ? await thumbnailToBase64(v.thumbnailUrl) : null,
        }))
      )
      thumbnailImages = b64Results.filter((x: any) => x.base64 !== null) as any
    }

    // ── 6. Respuesta final ────────────────────────────────────────────────
    return new Response(
      JSON.stringify({
        channel: {
          id:              chId,
          handle:          `@${cleanHandle}`,
          title:           snippet.title,
          description:     snippet.description,
          country:         snippet.country || null,
          subscriberCount: parseInt(stats.subscriberCount || '0'),
          videoCount:      parseInt(stats.videoCount      || '0'),
          viewCount:       parseInt(stats.viewCount       || '0'),
          publishedAt:     snippet.publishedAt,
        },
        topVideos,
        thumbnailImages,   // base64 para Gemini Vision — solo top 7
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err: any) {
    console.error('youtube-channel error:', err)
    return new Response(
      JSON.stringify({ error: err.message || 'Error inesperado.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
