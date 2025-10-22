import { Injectable } from '@nestjs/common';

type TmdbMovieResult = {
  id: number;
  title: string;
  poster_path?: string | null;
  runtime?: number | null;
  genres?: { id: number; name: string }[];
};

@Injectable()
export class TmdbService {
  private base = process.env.TMDB_BASE_URL!;
  private key = process.env.TMDB_API_KEY!;

  private withKey(url: string) {
    const q = url.includes('?') ? '&' : '?';
    return `${url}${q}api_key=${this.key}&language=en-US`;
  }

  async search(query: string, page = 1) {
    const url = this.withKey(
      `${this.base}/search/movie?query=${encodeURIComponent(query)}&page=${page}`,
    );
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDb search failed: ${res.status}`);
    return res.json();
  }

  async details(tmdbId: number): Promise<TmdbMovieResult> {
    const url = this.withKey(`${this.base}/movie/${tmdbId}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDb details failed: ${res.status}`);
    return res.json() as Promise<TmdbMovieResult>;
  }
}
