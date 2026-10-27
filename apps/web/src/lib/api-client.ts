const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`API retornou status ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error('Falha ao conectar com a API:', error);
    return null;
  }
}
