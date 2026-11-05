// ============================================================================
// Zero-Dependency Procedural Reaction Sound Engine & Motivational Speech API
// ============================================================================

class SoundEngine {
  constructor() {
    this.ctx = null
    this.STORAGE_KEY = 'dashboard_sound_muted'
    this.lastReactionTime = 0
  }

  init() {
    if (typeof window === 'undefined') return
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  isMuted() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.STORAGE_KEY) === 'true'
    }
    return false
  }

  setMuted(mutedState) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, String(Boolean(mutedState)))
      window.dispatchEvent(
        new CustomEvent('dashboard_sound_toggle', { detail: { isMuted: Boolean(mutedState) } })
      )
    }
    return Boolean(mutedState)
  }

  toggleMute() {
    const next = !this.isMuted()
    return this.setMuted(next)
  }

  // ============================================================================
  // 1. SURPLUS — OUTSTANDING! 👏
  // "Outstanding!" + Crowd applause + cheering + celebratory reaction (2–3s)
  // Identical high-energy experience in both English & Urdu
  // ============================================================================
  playSurplusReaction(isUrdu = false) {
    if (this.isMuted()) return
    const nowMs = Date.now()
    if (nowMs - this.lastReactionTime < 1400) return
    this.lastReactionTime = nowMs
    this.init()

    // 1A. Clear celebratory vocal exclamation: "Outstanding!"
    this._speakWord('Outstanding!', {
      pitch: 1.2,
      rate: 1.05,
      volume: 1.0
    })

    if (!this.ctx) return
    const now = this.ctx.currentTime

    // 1B. Dense Stadium Crowd Applause (450 claps/sec over 2.8s)
    this._generateEnthusiasticApplause(now + 0.12, 2.7)

    // 1C. Swelling Stadium Crowd Cheer Formant Bed (2.8s)
    this._generateCrowdCheer(now + 0.15, 2.6)

    // 1D. Celebratory Whistle Accent (Upward slide)
    this._generateStadiumWhistle(now + 0.35, 0.7)

    // 1E. Cascading Ascending Victory Chimes (C5 -> E5 -> G5 -> A5 -> C6)
    const victoryChimes = [523.25, 659.25, 783.99, 880.0, 1046.5]
    victoryChimes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + 0.3 + idx * 0.08)

      gain.gain.setValueAtTime(0.0001, now + 0.3 + idx * 0.08)
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.3 + idx * 0.08 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3 + idx * 0.08 + 0.42)

      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(now + 0.3 + idx * 0.08)
      osc.stop(now + 0.3 + idx * 0.08 + 0.45)
    })
  }

  // ============================================================================
  // 2. DEFICIT — LET'S DO BETTER! 🚀
  // "Let's Do Better!" + Motivational crowd chanting +
  // energetic supportive reaction (2–3s)
  // Identical high-energy experience in both English & Urdu
  // ============================================================================
  playDeficitReaction(isUrdu = false) {
    if (this.isMuted()) return
    const nowMs = Date.now()
    if (nowMs - this.lastReactionTime < 1400) return
    this.lastReactionTime = nowMs
    this.init()

    // 2A. Energetic motivational chant spoken clearly: "Let's Do Better!"
    this._speakWord("Let's Do Better!", {
      pitch: 1.12,
      rate: 1.15,
      volume: 1.0
    })

    if (!this.ctx) return
    const now = this.ctx.currentTime

    // 2B. Motivational Stadium Rhythmic Beat (Stomp-Stomp-Clap cadence over 2.8s)
    this._generateMotivationalStadiumChant(now + 0.1, 2.7)

    // 2C. Uplifting Supportive Motivational Chords (F3 -> G3 -> A3 -> C4)
    const motivationalNotes = [174.61, 196.00, 220.00, 261.63]
    motivationalNotes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      const filter = this.ctx.createBiquadFilter()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(freq, now + 0.2 + idx * 0.3)

      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(650, now + 0.2 + idx * 0.3)
      filter.frequency.exponentialRampToValueAtTime(1400, now + 0.2 + idx * 0.3 + 0.3)

      gain.gain.setValueAtTime(0.0001, now + 0.2 + idx * 0.3)
      gain.gain.linearRampToValueAtTime(0.08, now + 0.2 + idx * 0.3 + 0.06)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2 + idx * 0.3 + 0.55)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(now + 0.2 + idx * 0.3)
      osc.stop(now + 0.2 + idx * 0.3 + 0.58)
    })
  }

  // ============================================================================
  // 3. TACTILE CARD TAP / BOUNCE POP
  // ============================================================================
  playBounce() {
    if (this.isMuted()) return
    this.init()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(320, now)
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.07)

    gain.gain.setValueAtTime(0.22, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07)

    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start(now)
    osc.stop(now + 0.08)
  }

  // ============================================================================
  // INTERNAL ACOUSTIC SYNTHESIS HELPERS
  // ============================================================================

  _speakWord(text, { pitch = 1.0, rate = 1.0, volume = 1.0 } = {}) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    try {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.pitch = pitch
      utterance.rate = rate
      utterance.volume = volume
      utterance.lang = 'en-US'

      const voices = window.speechSynthesis.getVoices()
      if (voices && voices.length > 0) {
        // Find best energetic English voice
        const matched = voices.find(
          (v) =>
            v.lang &&
            (v.lang.startsWith('en-US') ||
              v.lang.startsWith('en-GB') ||
              v.lang.toLowerCase().startsWith('en'))
        )
        if (matched) utterance.voice = matched
      }

      window.speechSynthesis.speak(utterance)
    } catch (e) {
      // AudioContext procedural layer still plays
    }
  }

  // Enthusiastic Stadium Applause: 450 handclap transients per second with spatial spread
  _generateEnthusiasticApplause(startTime, duration = 2.8) {
    const bufferSize = Math.floor(this.ctx.sampleRate * duration)
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)

    const totalClaps = Math.floor(duration * 450)
    for (let i = 0; i < totalClaps; i++) {
      const clapOffset = Math.floor(Math.random() * bufferSize)
      const clapLength = Math.floor(this.ctx.sampleRate * 0.024)
      const envelope = Math.sin((clapOffset / bufferSize) * Math.PI)
      const amp = (0.35 + Math.random() * 0.65) * envelope

      for (let j = 0; j < clapLength && clapOffset + j < bufferSize; j++) {
        data[clapOffset + j] +=
          (Math.random() * 2 - 1) * amp * Math.exp(-j / (this.ctx.sampleRate * 0.0045))
      }
    }

    const source = this.ctx.createBufferSource()
    source.buffer = buffer

    const bandpass = this.ctx.createBiquadFilter()
    bandpass.type = 'bandpass'
    bandpass.frequency.setValueAtTime(1750, startTime)
    bandpass.Q.setValueAtTime(1.2, startTime)

    const masterGain = this.ctx.createGain()
    masterGain.gain.setValueAtTime(0.001, startTime)
    masterGain.gain.linearRampToValueAtTime(0.24, startTime + 0.3)
    masterGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

    source.connect(bandpass)
    bandpass.connect(masterGain)
    masterGain.connect(this.ctx.destination)

    source.start(startTime)
    source.stop(startTime + duration)
  }

  // Stadium Whistle Accent (Smooth frequency sweep upward)
  _generateStadiumWhistle(startTime, duration = 0.7) {
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(1850, startTime)
    osc.frequency.linearRampToValueAtTime(2750, startTime + duration * 0.45)
    osc.frequency.linearRampToValueAtTime(2400, startTime + duration)

    gain.gain.setValueAtTime(0.0001, startTime)
    gain.gain.linearRampToValueAtTime(0.065, startTime + 0.1)
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start(startTime)
    osc.stop(startTime + duration)
  }

  // Swelling Formant Crowd Cheer
  _generateCrowdCheer(startTime, duration = 2.7) {
    const formants = [580, 850, 1950, 2700]

    formants.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      const filter = this.ctx.createBiquadFilter()

      osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle'
      const baseFreq = 150 + idx * 2.2 + (Math.random() * 4 - 2)
      osc.frequency.setValueAtTime(baseFreq, startTime)
      osc.frequency.linearRampToValueAtTime(baseFreq + 22, startTime + duration * 0.65)

      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(freq, startTime)
      filter.Q.setValueAtTime(3.4, startTime)

      gain.gain.setValueAtTime(0.0001, startTime)
      gain.gain.linearRampToValueAtTime(0.055, startTime + 0.35)
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(startTime)
      osc.stop(startTime + duration)
    })
  }

  // Motivational Crowd Chanting Cadence (Stomp - Stomp - Clap with supportive crowd bed)
  _generateMotivationalStadiumChant(startTime, duration = 2.7) {
    // Rhythmic stadium stomp & clap pulse timings (0.0s, 0.35s, 0.7s, 1.1s, 1.45s, 1.8s)
    const beats = [0.0, 0.35, 0.72, 1.15, 1.5, 1.88]

    beats.forEach((offset, idx) => {
      const t = startTime + offset
      const isClap = idx % 3 === 2

      if (isClap) {
        // Energetic crowd handclap burst
        const clapDuration = 0.14
        const bufferSize = Math.floor(this.ctx.sampleRate * clapDuration)
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
        const data = buffer.getChannelData(0)
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.022))
        }

        const source = this.ctx.createBufferSource()
        source.buffer = buffer

        const filter = this.ctx.createBiquadFilter()
        filter.type = 'bandpass'
        filter.frequency.setValueAtTime(1450, t)
        filter.Q.setValueAtTime(1.5, t)

        const gain = this.ctx.createGain()
        gain.gain.setValueAtTime(0.18, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + clapDuration)

        source.connect(filter)
        filter.connect(gain)
        gain.connect(this.ctx.destination)
        source.start(t)
        source.stop(t + clapDuration)
      } else {
        // Deep acoustic stadium foot-stomp / kick (punchy 75Hz -> 42Hz)
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()

        osc.type = 'sine'
        osc.frequency.setValueAtTime(85, t)
        osc.frequency.exponentialRampToValueAtTime(42, t + 0.12)

        gain.gain.setValueAtTime(0.22, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18)

        osc.connect(gain)
        gain.connect(this.ctx.destination)
        osc.start(t)
        osc.stop(t + 0.19)
      }
    })

    // Supportive crowd vocal formant chant bed ("HUH! HEY! LET'S GO!")
    const cheerFreqs = [450, 780, 1600]
    cheerFreqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      const filter = this.ctx.createBiquadFilter()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(130 + idx * 8, startTime)
      osc.frequency.linearRampToValueAtTime(165, startTime + duration * 0.7)

      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(freq, startTime)
      filter.Q.setValueAtTime(2.8, startTime)

      gain.gain.setValueAtTime(0.0001, startTime)
      gain.gain.linearRampToValueAtTime(0.045, startTime + 0.3)
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(startTime)
      osc.stop(startTime + duration)
    })
  }
}

export const soundEffects = new SoundEngine()

export const playProceduralSound = (type, isMuted = false, isUrdu = false) => {
  if (isMuted || soundEffects.isMuted()) return
  if (type === 'surplus') soundEffects.playSurplusReaction(isUrdu)
  else if (type === 'deficit') soundEffects.playDeficitReaction(isUrdu)
  else if (type === 'bounce') soundEffects.playBounce()
}

export default soundEffects
