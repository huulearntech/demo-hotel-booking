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

// Simplify things, maybe just need to be polised on user role for now.
export default async function Feed () {
  const title = "Khám phá điểm đến";
  const locations = await fetchFeed();
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
          <TabsList className="bg-inherit gap-x-2" >
            {locations.map(({ provinceName }) => (
              <TabsTrigger value={provinceName} key={provinceName}
                className="h-9 text-sm font-bold px-3 py-2 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:text-primary-foreground dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 bg-accent text-foreground dark:text-muted-foreground data-[state=active]:shadow-sm"
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
                      // TODO
                      href="#"
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>

              <CarouselNext className="max-lg:hidden"/>
              <CarouselPrevious className="max-lg:hidden"/>
            </Carousel>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}