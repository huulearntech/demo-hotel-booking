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

export function FilterForm({ isSheet = false }: { isSheet?: boolean }) {
  const { control } = useFilterForm();

  return (
    <div
      data-issheet={isSheet}
      className="flex flex-col space-y-3 w-full max-w-sm overflow-y-auto data-[issheet=true]:px-3"
    >
      <Controller
        control={control}
        name="priceRange"
        defaultValue={[FILTER_MIN_PRICE, FILTER_MAX_PRICE]}
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
                      // TODO: we should also enforce that the price range values are within the allowed min and max bounds (e.g. if user enters a value less than minPrice or greater than maxPrice, we should reset it to the respective bound). For now, we just ensure that min is not greater than max.
                      if (priceRange[0] > priceRange[1]) {
                        setPriceRange([priceRange[1], priceRange[0]]);
                      }
                    }}
                  />
                  <div className="h-px w-2 bg-(--color-border) top-1/2 left-1/2 -translate-x-1 absolute" />
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
        defaultValue={Object.keys(FILTER_CATEGORIES)}
      >
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
                        <div key={option} className="flex items-center">
                          <Checkbox
                            id={`${category}-${option}`}
                            checked={value.includes(option)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                onChange([...value, option]);
                              } else {
                                onChange(value.filter((v: string) => v !== option));
                              }
                            }}
                          />
                          <Label htmlFor={`${category}-${option}`} className="ml-2 text-sm cursor-pointer">
                            {option} {/** TODO: separate label from value */}
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
  const filterHasChanged = formState.isDirty;
  const formValues = getValues();
  const isDefault = (
    formValues.priceRange[0] === defaultFilterValues.priceRange[0] &&
    formValues.priceRange[1] === defaultFilterValues.priceRange[1] &&
    formValues.sortBy === defaultFilterValues.sortBy &&
    formValues.amenities.length === 0 &&
    formValues.propertyTypes.length === 0 &&
    formValues.ratings.length === 0
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
          console.log(values, "filter has changed: ", filterHasChanged); // call some server actions (only if filterHasChanged)
          reset(values);
        }}
      >
        Áp dụng
      </Button>
    </div>
  );
};