export type TMDBMovie = {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
};

export interface ModalProps {
  onClose: () => void;
}

export type TMDBMovieDetails = {
  id: number;
  overview: string;
  title: string;
  release_date: string;
  poster_path: string | null;
};
