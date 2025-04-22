// src/lib/transcripts.ts
// Import API-nøkkel og prosjekt-ID fra voiceflow.ts
// Disse vil bli eksportert fra voiceflow.ts i et senere steg
import { RUNTIME_API_KEY, PROJECT_ID } from './voiceflow';

// Hent VersionID fra miljøvariabler, med fallback til 'production'
const VERSION_ID = import.meta.env.VITE_VOICEFLOW_VERSION_ID || 'production';

/**
 * Lagrer en transkripsjon til Voiceflow API for en gitt brukerøkt
 * @param sessionID - Bruker-ID for samtalen
 * @returns Promise med statusen til API-kallet
 */
export async function saveTranscript(sessionID: string): Promise<boolean> {
  if (!RUNTIME_API_KEY || !PROJECT_ID) {
    console.error('Mangler Voiceflow API-nøkkel eller prosjekt-ID for transcript-lagring');
    return false;
  }

  try {
    const response = await fetch('https://api.voiceflow.com/v2/transcripts', {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': RUNTIME_API_KEY
      },
      body: JSON.stringify({
        projectID: PROJECT_ID,
        versionID: VERSION_ID,
        sessionID: sessionID
      })
    });

    if (!response.ok) {
      console.error(`Feil ved lagring av transkripsjon: ${response.status}`);
      return false;
    }

    // Lagre transcript_id fra responsen i sessionStorage
    try {
      const data = await response.json();
      if (data && data._id) {
        sessionStorage.setItem('vf_transcript_id', data._id);
      }
    } catch (parseError) {
      console.error('Kunne ikke tolke transkripsjon-respons:', parseError);
    }

    return true;
  } catch (error) {
    console.error('Feil ved lagring av transkripsjon:', error);
    return false;
  }
}

/**
 * Lagrer transkripsjon med automatisk gjenforsøk ved feil
 * @param sessionID - Bruker-ID for samtalen
 * @param maxRetries - Maksimalt antall gjenforsøk (standard: 3)
 * @returns Promise med statusen til API-kallet
 */
export async function saveTranscriptWithRetry(
  sessionID: string, 
  maxRetries: number = 3
): Promise<boolean> {
  let retries = 0;
  
  while (retries < maxRetries) {
    const success = await saveTranscript(sessionID);
    if (success) return true;
    
    // Vent litt lenger for hvert forsøk
    retries++;
    await new Promise(resolve => setTimeout(resolve, 1000 * retries));
  }
  
  return false;
} 