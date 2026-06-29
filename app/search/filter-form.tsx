"use client";

import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionTrigger, AccordionItem } from '@/components/ui/accordion';

import { Controller } from 'react-hook-form';
import { useFilterForm } from './filter-form-context';
import { defaultFilterValues, FILTER_CATEGORIES } from "@/lib/zod_schemas/filter";

import { FILTER_MAX_PRICE, FILTER_MIN_PRICE, FILTER_PRICE_STEP } from '@/lib/constants';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

export function FilterForm({ isSheet = false, className }: { isSheet?: boolean, className?: string }) {
  const { control } = useFilterForm();

  return (
    <div
      data-issheet={isSheet}
      className={cn("flex flex-col space-y-3 w-full max-w-sm data-[issheet=true]:px-3", className)}
    >
      <Controller
        control={control}
        name="priceRange"
        defaultValue={defaultFilterValues.priceRange}
        render={({ field: { value: priceRange, onChange: setPriceRange } }) => {
          return (
            <div className="w-full bg-white border border-gray-300 rounded-lg p-4 flex flex-col space-y-3">
              <div>
                <h4 className="text-sm font-bold">Khoảng giá</h4>
                <p className="text-xs text-gray-500 mb-2">1 phòng, 1 đêm</p>
              </div>
              <Slider
                min={FILTER_MIN_PRICE}
                max={FILTER_MAX_PRICE}
                step={FILTER_PRICE_STEP}
                value={priceRange}
                onValueChange={setPriceRange}
              />
              <div className="flex items-center mt-2 space-x-2">
                <div className="relative flex space-x-2">
                  <Input
                    type="text"
                    inputMode="numeric"
                    name="minPrice"
                    placeholder="Min Price"
                    className="px-2 py-1 rounded-full h-auto"
                    value={priceRange[0]}
                    onChange={e => {
                      const newMin = Number(e.target.value.replace(/[^0-9]/g, ''));
                      setPriceRange([isNaN(newMin) ? FILTER_MIN_PRICE : newMin, priceRange[1]]);
                    }}
                    onBlur={() => {
                      if (priceRange[0] < FILTER_MIN_PRICE) {
                        setPriceRange([FILTER_MIN_PRICE, priceRange[1]]);
                      } else if (priceRange[0] > FILTER_MAX_PRICE) {
                        setPriceRange([priceRange[1], FILTER_MAX_PRICE]);
                      }
                      if (priceRange[0] > priceRange[1]) {
                        setPriceRange([priceRange[1], priceRange[0]]);
                      }
                    }}
                  />
                  <div className="h-0 w-2 border border-(--color-border) top-1/2 left-1/2 -translate-x-1 absolute" />
                  <Input
                    type="text"
                    inputMode="numeric"
                    name="maxPrice"
                    placeholder="Max Price"
                    className="px-2 py-1 rounded-full h-auto"
                    value={priceRange[1]}
                    onChange={e => {
                      const newMax = Number(e.target.value.replace(/[^0-9]/g, ''));
                      setPriceRange([priceRange[0], isNaN(newMax) ? FILTER_MAX_PRICE : newMax]);
                    }}
                    onBlur={() => {
                      if (priceRange[1] < FILTER_MIN_PRICE) {
                        setPriceRange([FILTER_MIN_PRICE, priceRange[0]]);
                      } else if (priceRange[1] > FILTER_MAX_PRICE) {
                        setPriceRange([priceRange[0], FILTER_MAX_PRICE]);
                      }
                      if (priceRange[0] > priceRange[1]) {
                        setPriceRange([priceRange[1], priceRange[0]]);
                      }
                    }}
                  />
                </div>
                <span className="text-right text-xs">VND</span>
              </div>
            </div>
          );
        }}
      />

      <Accordion
        type="multiple"
        className="flex-col space-y-3"
        defaultValue={[...Object.keys(FILTER_CATEGORIES), "ratingRange"]}
      >
        <AccordionItem
          value={"ratingRange"}
          className="border rounded-md last:border"
        >
          <AccordionTrigger className="flex px-4 py-3 justify-between items-center text-sm font-bold">
            Đánh giá
          </AccordionTrigger>
          <AccordionContent className="flex flex-col px-4 gap-y-2">
            <Controller
              control={control}
              name="ratingRange"
              defaultValue={defaultFilterValues.ratingRange}
              render={({ field: { value: ratingRange, onChange: setRatingRange } }) => {
                const min = defaultFilterValues.ratingRange[0];
                const max = defaultFilterValues.ratingRange[1];
                const ticks = Array.from({ length: max - min + 1 }, (_, i) => min + i);

          return (
            <div className="w-full flex flex-col gap-y-2">
              <div className="text-sm text-muted-foreground">
                từ {ratingRange[0]} đến {ratingRange[1]} sao
              </div>

              <Slider
                min={min}
                max={max}
                step={1}
                value={ratingRange}
                onValueChange={setRatingRange}
              />

              <div className="flex items-center justify-between px-1 text-sm select-none">
                {ticks.map((t) => {
                  const active = t >= ratingRange[0] && t <= ratingRange[1];
                  return (
                    <div key={t} className={cn("mt-1", active ? "text-primary" : "text-muted-foreground")}>
                      {t}
                    </div>
                  );
                })}
              </div>
            </div>
          );
              }}
            />
          </AccordionContent>
        </AccordionItem>

        {Object.entries(FILTER_CATEGORIES).map(([category_key, category]) => {
          return (
            <AccordionItem
              key={category_key as keyof typeof FILTER_CATEGORIES}
              value={category_key as keyof typeof FILTER_CATEGORIES}
              className="border rounded-md last:border"
            >
              <AccordionTrigger className="flex px-4 py-3 justify-between items-center text-sm font-bold">
                {category.label}
              </AccordionTrigger>

              <AccordionContent className="flex flex-col px-4">
                {/* Controller manages an array of selected option strings for this category */}
                <Controller
                  control={control}
                  name={category_key as keyof typeof FILTER_CATEGORIES}
                  defaultValue={[]}
                  render={({ field: { value, onChange } }: { field: { value: string[]; onChange: (v: string[]) => void } }) => (
                    <div className="flex flex-col gap-2">
                      {category.options.map((option) => (
                        <div key={option.value} className="flex items-center">
                          <Checkbox
                            id={`${category_key}-${option.value}`}
                            checked={value.includes(option.value)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                onChange([...value, option.value]);
                              } else {
                                onChange(value.filter((v: string) => v !== option.value));
                              }
                            }}
                          />
                          <Label htmlFor={`${category_key}-${option.value}`} className="ml-2 text-sm cursor-pointer">
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                />
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  );
}

export function FilterForm__Reset_and_Apply_Buttons() {
  const { reset, getValues, formState } = useFilterForm();
  const queryClient = useQueryClient();
  const filterHasChanged = formState.isDirty;
  const formValues = getValues();
  const isDefault = (
    formValues.priceRange[0] === defaultFilterValues.priceRange[0] &&
    formValues.priceRange[1] === defaultFilterValues.priceRange[1] &&
    formValues.sortBy === defaultFilterValues.sortBy &&
    formValues.amenities.length === 0 &&
    formValues.propertyTypes.length === 0 &&
    formValues.ratingRange[0] === defaultFilterValues.ratingRange[0] &&
    formValues.ratingRange[1] === defaultFilterValues.ratingRange[1]
  )
  
  return (
    <div className="flex gap-2">
      <Button
        variant='outline'
        className="flex-1"
        disabled={isDefault}
        onClick={() => reset(defaultFilterValues)}
      >
        Đặt lại
      </Button>

      <Button
        className="flex-1"
        disabled={!filterHasChanged}
        onClick={() => {
          const values = getValues();
          reset(values);
          queryClient.resetQueries({ queryKey: ["hotels"] });
        }}
      >
        Áp dụng
      </Button>
    </div>
  );
};