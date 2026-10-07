/**
 * Utilitaires pour la gestion du stockage et validation du JWT.
 *
 * ## Choix de localStorage pour la persistance du token
 *
 * **Pourquoi localStorage** :
 * - L'API utilise `Authorization: Bearer` (pas de cookie HttpOnly disponible).
 * - La feature impose la persistance après refresh et le partage entre onglets.
 * - localStorage remplit ces deux exigences sans modification du back.
 *
 * **Pourquoi pas un cookie HttpOnly** :
 * - L'API existante est en Bearer, pas en cookie.
 * - Migrer demanderait un changement côté back (gestion des cookies) et une protection CSRF.
 * - Ces changements dépassent le périmètre actuel (API existante à adaprer au front, pas à refondre).
 *
 * **Risque XSS résiduel** :
 * - Un script injecté (`<script>` ou attribut malveillant) peut accéder à localStorage et lire le token.
 * - Cela ne peut pas être complètement éliminé côté client.
 *
 * **Mitigations** :
 * - Ne stocker que le token, pas d'autres données sensibles.
 * - Le token expire via son champ `exp` (court terme, ex. 1 heure).
 * - Un 401 de l'API efface le token et déconnecte immédiatement (logout automatique).
 * - Confier la sécurité XSS au back (CSP, input validation, pas d'eval).
 */

const TOKEN_KEY = 'app.access_token';

/**
 * Décode le payload d'un JWT sans vérifier la signature.
 * @param token Token JWT
 * @returns Payload décodé, null si malformé, ou undefined si décodage échoue
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null | undefined {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return undefined; // Malformé

    const payload = parts[1];
    const padded = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), '=');
    const decoded = atob(padded);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return undefined; // Malformé
  }
}

/**
 * Vérifie si un JWT est expiré en contrôlant le champ `exp` du payload.
 * @param token Token JWT
 * @returns true si le token est expiré ou malformé, false si valide
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (payload === undefined) {
    // Token malformé = considéré comme expiré
    return true;
  }

  if (payload === null || typeof payload['exp'] !== 'number') {
    // Pas de champ `exp` = considéré comme valide (non expiré)
    return false;
  }

  const expiryTime = (payload['exp'] as number) * 1000; // en millisecondes
  return Date.now() >= expiryTime;
}

/**
 * Récupère un token valide (non expiré) depuis le localStorage.
 * Voir la doc du module pour justification et mitigations du risque XSS.
 * @returns Token valide ou null
 */
export function getStoredToken(): string | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    if (isTokenExpired(token)) {
      clearStoredToken();
      return null;
    }
    return token;
  } catch {
    // localStorage indisponible (mode privé, quota dépassé, etc.)
    // Repli gracieux : utiliser la mémoire, revenir à null
    return null;
  }
}

/**
 * Persiste un token en localStorage.
 * @param token Token à persister
 */
export function setStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // localStorage indisponible (mode privé, quota dépassé, etc.) :
    // le token reste en mémoire dans le signal, la session reste fonctionnelle
  }
}

/**
 * Supprime le token du localStorage.
 */
export function clearStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // localStorage indisponible ; la suppression est best-effort
  }
}

/**
 * Retourne la clé de stockage (pour l'écoute des événements `storage`).
 */
export function getTokenStorageKey(): string {
  return TOKEN_KEY;
}
