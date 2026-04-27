import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext
} from "@/components/ui/carousel";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "@/components/ui/tabs";

import HotelCard from "@/components/hotel-card";
import { fetchFeed } from "@/lib/actions/home";
import { codec_searchSpec } from "@/lib/zod_schemas/search-bar";
import { PATHS } from "@/lib/constants";

// TODO: Standardize this as the default. Maybe get from local storage first, if there is none, fallback?
const defaultSpec: {
  inOutDates: {
    from: Date,
    to: Date
  },
  guestsAndRooms: {
    numAdults: number,
    numChildren: number,
    numRooms: number
  }
} = {
  inOutDates: {
    from: new Date(),
    to: new Date(new Date().getTime() + 24 * 60 * 60 * 1000)
  },
  guestsAndRooms: {
    numAdults: 2,
    numChildren: 0,
    numRooms: 1
  }
};

// Simplify things, maybe just need to be polised on user role for now.
export default async function Feed () {
  const title = "Khám phá điểm đến";
  const stringifiedSearchParams = new URLSearchParams(codec_searchSpec.encode(defaultSpec)).toString();

  const locations = await fetchFeed();
  if (!locations || locations.length === 0) {
    return (
      <div className="py-8">
        <p className="text-center text-sm text-gray-500">Không có địa điểm nào để hiển thị.</p>
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-y-4">
      <div className="content">
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>
      <Tabs
        defaultValue={locations[0].provinceName}
        className="content"
      >
        <div className="overflow-x-auto justify-start">
          <TabsList className="bg-inherit gap-x-2 h-11">
            {locations.map(({ provinceName }) => (
              <TabsTrigger value={provinceName} key={provinceName}
                className="h-[calc(100%-1px)] text-sm font-bold px-3 py-2 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:text-primary-foreground dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 bg-accent text-primary dark:text-muted-foreground data-[state=active]:shadow-sm"
              >
                {provinceName}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {locations.map(({ provinceName, hotels }) => (
          <TabsContent value={provinceName} key={provinceName}>
            <Carousel opts={{ align: "start" }}
            >
              <CarouselContent className="p-2">
                {hotels.map((hotel) => (
                  <CarouselItem
                    key={hotel.id}
                    className="min-[512px]:basis-1/2 md:basis-1/3 xl:basis-1/4"
                  >
                    <HotelCard
                      hotel={hotel}
                      href={`${PATHS.hotels}/${hotel.id}?${stringifiedSearchParams}`}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>

              <CarouselNext className="max-lg:hidden" />
              <CarouselPrevious className="max-lg:hidden" />
            </Carousel>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}