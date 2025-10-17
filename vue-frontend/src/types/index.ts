export interface Photo {
  id: string;
  src: string;
  alt: string;
  title: string;
  category: string;
  price: number;
}

export interface Magazine {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  price: number;
  releaseDate: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  image: string;
  details: string[];
  price: number;
}

export interface BookingSlot {
  start: string;
  end: string;
}