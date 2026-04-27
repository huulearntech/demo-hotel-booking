export type draft_HotelCardProps = {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  rating: number;
  numberOfReviews: number;
  wardName: string;
  provinceName: string;
  facilityNames: string[] | null;
  price: number;
  type: string;
  isFavorited: boolean | null;
}