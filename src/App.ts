import moment from "moment";
import $ from "jquery";
// import Json from "./Json";
// import MakeroiNotificationType from "./MakeroiNotificationType";
// import regions from "./regions.json";

// interface AddressData extends Json {
//   value: string;
//   unrestricted_value: string;
//   data: {
//     postal_code: null | string;
//   };
// }

export default class App {
  protected amoWidget: unknown;
  protected mode: string;

  constructor(amoWidget: unknown, mode: string) {
    this.amoWidget = amoWidget;
    this.mode = mode;
  }

  public getCallbacks(): Record<string, () => boolean | unknown> {
    const self = this;
    const methodsMap = {
      init: "onInit",
      bind_actions: "onBindActions",
      render: "onRender",
      dpSettings: "onDigitalPipelineSettings",
      settings: "onSettings",
      advancedSettings: "onAdvancedSettings",
      onSave: "onSave",
      destroy: "onDestroy",
      onAddAsSource: "onAddAsSource",
    };

    return Object.fromEntries(
      Object.entries(methodsMap)
        // @ts-ignore
        .map(([key, callback]) => [
          key,
          // @ts-ignore
          typeof self[callback] === "function"
            ? // @ts-ignore
              self[callback].bind(self)
            : self.defaultCallback.bind(self),
        ])
    );
  }

  public defaultCallback(): boolean {
    return true;
  }

  public render(
    template: string,
    params: Record<string | number, unknown> = {}
  ): Promise<string> {
    params = typeof params == "object" ? params : {};
    template = template || "";
    return new Promise((resolve) => {
      // @ts-ignore
      this.amoWidget.render.call(
        this.amoWidget,
        {
          href: "/templates/" + template + ".twig",
          // @ts-ignore
          base_path: this.amoWidget.get_settings()?.path,
          load: (template: { render: ({}) => string }) =>
            resolve(template.render(params)),
        },
        params
      );
    });
  }

  public onInit(): boolean {
    console.debug(moment.now(), "Тестирование moment");
    setInterval(() => this.makeAddress(), 500);
    return true;
  }

  public async onSettings(): Promise<boolean> {
    const AmoCRM = (window as any).APP;
    // @ts-ignore
    console.debug(
      await this.render("advanced_settings", {
        title: "Привет!",
        ...AmoCRM.params,
      }),
      "Тестирование twig"
    );
    return true;
  }
  // _________--------------+++++++++++++++=--------------_______________

  private async makeAddress(): Promise<void> {
    const AmoCRM = (window as any).APP;
    const APPCurrentEntity = AmoCRM.data.current_entity;
    console.debug(
      "APPCurrentEntity",
      APPCurrentEntity,
      APPCurrentEntity === "companies",
      AmoCRM.data.is_card
    );
    if (APPCurrentEntity === "companies") {
      if (AmoCRM.data.is_card) {
        // const $titleCountry = $('[title="Страна"]');
        // const $fieldCountry = $titleCountry.closest('div').next().find('input')
        const fieldId = "1156795";
        // CFV[1156795]
        const $field = $('[name="CFV[' + fieldId + ']"]');

        $field.parent().append(await this.render("CityHintBlock", {}));
        const $block = $field
          .parent()
          .parent()
          .find(".makeroi-city-hint-block > .list");
        $block.hide();
        let timeout: any = null;

        $field.on("focusin", async () => {
          clearTimeout(timeout);

          if ($field[0].localName === "textarea") {
            $field.closest('[data-type="edit"]').on("click", async () => {
              if ($field.val() === "") {
                $block.hide();
                return;
              }

              const currentCities = await this.getCities(
                $field.val() as string
              );
              console.log("currentCities-128", currentCities);

              $block.html(
                currentCities
                  // @ts-ignore
                  .map((v) => {
                    if (v.value?.includes('"')) {
                      return `<li data-value='${v.value}' data-postal="${
                        v.data.postal_code
                      }" class="item">
                      <div class="city-item">
                          <div class="title-item">${
                            v.value ?? "Без названия"
                          }</div>
                      </div>
                  </li>`;
                    } else {
                      return `<li data-value="${v.value}" data-postal="${
                        v.data.postal_code
                      }" class="item">
                      <div class="city-item">
                          <div class="title-item">${
                            v.value ?? "Без названия"
                          }</div>
                      </div>
                  </li>`;
                    }
                  })
                  .join("")
              );
              $block.show();
            });
          } else {
            if ($field.val() === "") {
              $block.hide();
              return;
            }

            const currentCities = this.getCities($field.val() as string);

            $block.html(
              currentCities
                // @ts-ignore
                .map((v) => {
                  if (v.value?.includes('"')) {
                    return `<li data-value='${v.value}' data-postal="${
                      v.data.postal_code
                    }" class="item">
                  <div class="city-item">
                      <div class="title-item">${v.value ?? "Без названия"}</div>
                  </div>
              </li>`;
                  } else {
                    return `<li data-value="${v.value}" data-postal="${
                      v.data.postal_code
                    }" class="item">
                  <div class="city-item">
                      <div class="title-item">${v.value ?? "Без названия"}</div>
                  </div>
              </li>`;
                  }
                })
                .join("")
            );
            $block.show();
          }
        });

        $field.on("focusout", () => {
          timeout = setTimeout(() => $block.hide(), 100);
        });

        $field.on("input cut paste", async () => {
          const addressBlock = $(
            '.card-cf-actions-tip > .js-tip-items > [data-type="map"]'
          );

          if (addressBlock.length !== 0) {
            addressBlock.closest(".card-cf-actions-tip").hide();
          }

          if ($field.val() === "") {
            $block.hide();
            return;
          }

          const currentCities = this.getCities($field.val() as string);

          $block.html(
            currentCities
              // @ts-ignore
              .map((v) => {
                if (v.value?.includes('"')) {
                  return `<li data-value='${v.value}' data-postal="${
                    v.data.postal_code
                  }" class="item">
              <div class="city-item">
                  <div class="title-item">${v.value ?? "Без названия"}</div>
              </div>
          </li>`;
                } else {
                  return `<li data-value="${v.value}" data-postal="${
                    v.data.postal_code
                  }" class="item">
              <div class="city-item">
                  <div class="title-item">${v.value ?? "Без названия"}</div>
              </div>
          </li>`;
                }
              })
              .join("")
          );
          $block.show();
        });

        $block.on("click mousedown", "li", (e: Event) => {
          const $selected = $(e.currentTarget as HTMLElement);
          let value = $selected.attr("data-value");
          // const postalCode = $selected.attr("data-postal");
          // const fieldId = $selected.parents(".linked-form__field").attr("data-id");
          // const amoCF = AmoCRM.getAccount().cf;
          if (value !== undefined) {
            $field.val(value).trigger("change");
          }
        });

        const $wrapField = $field.parent().parent();
        $(document).on("mouseup", (e: Event) => {
          const target = e.target as HTMLElement;
          if (
            !$field.is(":focus") &&
            !$wrapField
              .find('div[id^="makeroi-city-twig-makeroi"]')
              .is($(e.currentTarget as HTMLElement)) &&
            $wrapField.find('div[id^="makeroi-city-twig-makeroi"]').has(target)
              .length === 0
          ) {
            $block.hide();
          }
        });
      }
    }
  }

  private async searchAddress() {
    // console.debug("regions.Страны", regions.Страны);
    return this.suggestions();
    // return regions.Страны;
  }

  private async getCities(val: string) {
    if (val.length === 0) return [];
    return await this.searchAddress();
  }

  // private cardAnalyser(): void {
  //   const APPCurrentEntity = (window as any).APP.data.current_entity;
  //   if (APPCurrentEntity === "leads") {
  //     const settings = this.loadSettings();
  //     const idInputs: string[] = [];
  //     Object.values(settings).forEach((value) => {
  //       idInputs.push(value);
  //     });
  //     const inputs: (HTMLInputElement | null)[] = [];
  //     idInputs.forEach((id) => {
  //       inputs.push(document.querySelector(`input[name="CFV[${id}]"]`));
  //     });
  //     const inputSum = inputs.splice(-1, 1)[0];
  //     if (inputSum !== this.inputForSum && this.inputForSum) {
  //       this.inputForSum.value = "";
  //     }
  //     this.inputForSum = inputSum;

  //     if (inputs.length > 0 && inputSum) {
  //       inputs.forEach((summand) => {
  //         // Удаляем существующий обработчик событий 'change'
  //         summand?.removeEventListener("change", () => {
  //           this.adder(inputs, inputSum);
  //         });
  //         // Добавляем новый обработчик событий 'change'
  //         summand?.addEventListener("change", () => {
  //           this.adder(inputs, inputSum);
  //         });
  //       });
  //       this.adder(inputs, inputSum);
  //     }
  //   }
  // }

  private suggestions() {
    // Твер
    return [
      {
        value: "Тверская обл",
        unrestricted_value: "Тверская обл",
        data: {
          postal_code: null,
          country: "Россия",
          country_iso_code: "RU",
          federal_district: "Центральный",
          region_fias_id: "61723327-1c20-42fe-8dfa-402638d9b396",
          region_kladr_id: "6900000000000",
          region_iso_code: "RU-TVE",
          region_with_type: "Тверская обл",
          region_type: "обл",
          region_type_full: "область",
          region: "Тверская",
          area_fias_id: null,
          area_kladr_id: null,
          area_with_type: null,
          area_type: null,
          area_type_full: null,
          area: null,
          city_fias_id: null,
          city_kladr_id: null,
          city_with_type: null,
          city_type: null,
          city_type_full: null,
          city: null,
          city_area: null,
          city_district_fias_id: null,
          city_district_kladr_id: null,
          city_district_with_type: null,
          city_district_type: null,
          city_district_type_full: null,
          city_district: null,
          settlement_fias_id: null,
          settlement_kladr_id: null,
          settlement_with_type: null,
          settlement_type: null,
          settlement_type_full: null,
          settlement: null,
          street_fias_id: null,
          street_kladr_id: null,
          street_with_type: null,
          street_type: null,
          street_type_full: null,
          street: null,
          stead_fias_id: null,
          stead_cadnum: null,
          stead_type: null,
          stead_type_full: null,
          stead: null,
          house_fias_id: null,
          house_kladr_id: null,
          house_cadnum: null,
          house_flat_count: null,
          house_type: null,
          house_type_full: null,
          house: null,
          block_type: null,
          block_type_full: null,
          block: null,
          entrance: null,
          floor: null,
          flat_fias_id: null,
          flat_cadnum: null,
          flat_type: null,
          flat_type_full: null,
          flat: null,
          flat_area: null,
          square_meter_price: null,
          flat_price: null,
          room_fias_id: null,
          room_cadnum: null,
          room_type: null,
          room_type_full: null,
          room: null,
          postal_box: null,
          fias_id: "61723327-1c20-42fe-8dfa-402638d9b396",
          fias_code: null,
          fias_level: "1",
          fias_actuality_state: "0",
          kladr_id: "6900000000000",
          geoname_id: "480041",
          capital_marker: "0",
          okato: "28000000000",
          oktmo: "28000000",
          tax_office: "6900",
          tax_office_legal: "6900",
          timezone: null,
          geo_lat: null,
          geo_lon: null,
          beltway_hit: null,
          beltway_distance: null,
          metro: null,
          divisions: null,
          qc_geo: "5",
          qc_complete: null,
          qc_house: null,
          history_values: null,
          unparsed_parts: null,
          source: null,
          qc: null,
        },
      },
      {
        value: "г Тверь",
        unrestricted_value: "170000, Тверская обл, г Тверь",
        data: {
          postal_code: "170000",
          country: "Россия",
          country_iso_code: "RU",
          federal_district: "Центральный",
          region_fias_id: "61723327-1c20-42fe-8dfa-402638d9b396",
          region_kladr_id: "6900000000000",
          region_iso_code: "RU-TVE",
          region_with_type: "Тверская обл",
          region_type: "обл",
          region_type_full: "область",
          region: "Тверская",
          area_fias_id: null,
          area_kladr_id: null,
          area_with_type: null,
          area_type: null,
          area_type_full: null,
          area: null,
          city_fias_id: "c52ea942-555e-45c6-9751-58897717b02f",
          city_kladr_id: "6900000100000",
          city_with_type: "г Тверь",
          city_type: "г",
          city_type_full: "город",
          city: "Тверь",
          city_area: null,
          city_district_fias_id: null,
          city_district_kladr_id: null,
          city_district_with_type: null,
          city_district_type: null,
          city_district_type_full: null,
          city_district: null,
          settlement_fias_id: null,
          settlement_kladr_id: null,
          settlement_with_type: null,
          settlement_type: null,
          settlement_type_full: null,
          settlement: null,
          street_fias_id: null,
          street_kladr_id: null,
          street_with_type: null,
          street_type: null,
          street_type_full: null,
          street: null,
          stead_fias_id: null,
          stead_cadnum: null,
          stead_type: null,
          stead_type_full: null,
          stead: null,
          house_fias_id: null,
          house_kladr_id: null,
          house_cadnum: null,
          house_flat_count: null,
          house_type: null,
          house_type_full: null,
          house: null,
          block_type: null,
          block_type_full: null,
          block: null,
          entrance: null,
          floor: null,
          flat_fias_id: null,
          flat_cadnum: null,
          flat_type: null,
          flat_type_full: null,
          flat: null,
          flat_area: null,
          square_meter_price: null,
          flat_price: null,
          room_fias_id: null,
          room_cadnum: null,
          room_type: null,
          room_type_full: null,
          room: null,
          postal_box: null,
          fias_id: "c52ea942-555e-45c6-9751-58897717b02f",
          fias_code: null,
          fias_level: "4",
          fias_actuality_state: "0",
          kladr_id: "6900000100000",
          geoname_id: "480060",
          capital_marker: "2",
          okato: "28401000000",
          oktmo: "28701000001",
          tax_office: "6900",
          tax_office_legal: "6900",
          timezone: null,
          geo_lat: "56.858605",
          geo_lon: "35.911756",
          beltway_hit: null,
          beltway_distance: null,
          metro: null,
          divisions: null,
          qc_geo: "4",
          qc_complete: null,
          qc_house: null,
          history_values: ["г Калинин"],
          unparsed_parts: null,
          source: null,
          qc: null,
        },
      },
      {
        value: "г Москва, ул Тверская",
        unrestricted_value: "г Москва, Тверской р-н, ул Тверская",
        data: {
          postal_code: null,
          country: "Россия",
          country_iso_code: "RU",
          federal_district: "Центральный",
          region_fias_id: "0c5b2444-70a0-4932-980c-b4dc0d3f02b5",
          region_kladr_id: "7700000000000",
          region_iso_code: "RU-MOW",
          region_with_type: "г Москва",
          region_type: "г",
          region_type_full: "город",
          region: "Москва",
          area_fias_id: null,
          area_kladr_id: null,
          area_with_type: null,
          area_type: null,
          area_type_full: null,
          area: null,
          city_fias_id: "0c5b2444-70a0-4932-980c-b4dc0d3f02b5",
          city_kladr_id: "7700000000000",
          city_with_type: "г Москва",
          city_type: "г",
          city_type_full: "город",
          city: "Москва",
          city_area: "Центральный",
          city_district_fias_id: null,
          city_district_kladr_id: null,
          city_district_with_type: null,
          city_district_type: null,
          city_district_type_full: null,
          city_district: null,
          settlement_fias_id: null,
          settlement_kladr_id: null,
          settlement_with_type: null,
          settlement_type: null,
          settlement_type_full: null,
          settlement: null,
          street_fias_id: "0ecde158-a58f-43af-9707-aa6dd3484b56",
          street_kladr_id: "77000000000287700",
          street_with_type: "ул Тверская",
          street_type: "ул",
          street_type_full: "улица",
          street: "Тверская",
          stead_fias_id: null,
          stead_cadnum: null,
          stead_type: null,
          stead_type_full: null,
          stead: null,
          house_fias_id: null,
          house_kladr_id: null,
          house_cadnum: null,
          house_flat_count: null,
          house_type: null,
          house_type_full: null,
          house: null,
          block_type: null,
          block_type_full: null,
          block: null,
          entrance: null,
          floor: null,
          flat_fias_id: null,
          flat_cadnum: null,
          flat_type: null,
          flat_type_full: null,
          flat: null,
          flat_area: null,
          square_meter_price: null,
          flat_price: null,
          room_fias_id: null,
          room_cadnum: null,
          room_type: null,
          room_type_full: null,
          room: null,
          postal_box: null,
          fias_id: "0ecde158-a58f-43af-9707-aa6dd3484b56",
          fias_code: null,
          fias_level: "7",
          fias_actuality_state: "0",
          kladr_id: "77000000000287700",
          geoname_id: "524901",
          capital_marker: "0",
          okato: "45286585000",
          oktmo: "45382000",
          tax_office: "7710",
          tax_office_legal: "7710",
          timezone: null,
          geo_lat: "55.763928",
          geo_lon: "37.606379",
          beltway_hit: null,
          beltway_distance: null,
          metro: null,
          divisions: null,
          qc_geo: "2",
          qc_complete: null,
          qc_house: null,
          history_values: null,
          unparsed_parts: null,
          source: null,
          qc: null,
        },
      },
      {
        value: "г Москва, ул 1-я Тверская-Ямская",
        unrestricted_value: "г Москва, Тверской р-н, ул 1-я Тверская-Ямская",
        data: {
          postal_code: null,
          country: "Россия",
          country_iso_code: "RU",
          federal_district: "Центральный",
          region_fias_id: "0c5b2444-70a0-4932-980c-b4dc0d3f02b5",
          region_kladr_id: "7700000000000",
          region_iso_code: "RU-MOW",
          region_with_type: "г Москва",
          region_type: "г",
          region_type_full: "город",
          region: "Москва",
          area_fias_id: null,
          area_kladr_id: null,
          area_with_type: null,
          area_type: null,
          area_type_full: null,
          area: null,
          city_fias_id: "0c5b2444-70a0-4932-980c-b4dc0d3f02b5",
          city_kladr_id: "7700000000000",
          city_with_type: "г Москва",
          city_type: "г",
          city_type_full: "город",
          city: "Москва",
          city_area: "Центральный",
          city_district_fias_id: null,
          city_district_kladr_id: null,
          city_district_with_type: null,
          city_district_type: null,
          city_district_type_full: null,
          city_district: null,
          settlement_fias_id: null,
          settlement_kladr_id: null,
          settlement_with_type: null,
          settlement_type: null,
          settlement_type_full: null,
          settlement: null,
          street_fias_id: "94d0cf51-2820-4409-bbd7-4a7d36f2922b",
          street_kladr_id: "77000000000287900",
          street_with_type: "ул 1-я Тверская-Ямская",
          street_type: "ул",
          street_type_full: "улица",
          street: "1-я Тверская-Ямская",
          stead_fias_id: null,
          stead_cadnum: null,
          stead_type: null,
          stead_type_full: null,
          stead: null,
          house_fias_id: null,
          house_kladr_id: null,
          house_cadnum: null,
          house_flat_count: null,
          house_type: null,
          house_type_full: null,
          house: null,
          block_type: null,
          block_type_full: null,
          block: null,
          entrance: null,
          floor: null,
          flat_fias_id: null,
          flat_cadnum: null,
          flat_type: null,
          flat_type_full: null,
          flat: null,
          flat_area: null,
          square_meter_price: null,
          flat_price: null,
          room_fias_id: null,
          room_cadnum: null,
          room_type: null,
          room_type_full: null,
          room: null,
          postal_box: null,
          fias_id: "94d0cf51-2820-4409-bbd7-4a7d36f2922b",
          fias_code: null,
          fias_level: "7",
          fias_actuality_state: "0",
          kladr_id: "77000000000287900",
          geoname_id: "524901",
          capital_marker: "0",
          okato: "45286585000",
          oktmo: "45382000",
          tax_office: "7710",
          tax_office_legal: "7710",
          timezone: null,
          geo_lat: "55.773596",
          geo_lon: "37.589761",
          beltway_hit: null,
          beltway_distance: null,
          metro: null,
          divisions: null,
          qc_geo: "2",
          qc_complete: null,
          qc_house: null,
          history_values: null,
          unparsed_parts: null,
          source: null,
          qc: null,
        },
      },
      {
        value: "г Москва, ул 2-я Тверская-Ямская",
        unrestricted_value:
          "125047, г Москва, Тверской р-н, ул 2-я Тверская-Ямская",
        data: {
          postal_code: "125047",
          country: "Россия",
          country_iso_code: "RU",
          federal_district: "Центральный",
          region_fias_id: "0c5b2444-70a0-4932-980c-b4dc0d3f02b5",
          region_kladr_id: "7700000000000",
          region_iso_code: "RU-MOW",
          region_with_type: "г Москва",
          region_type: "г",
          region_type_full: "город",
          region: "Москва",
          area_fias_id: null,
          area_kladr_id: null,
          area_with_type: null,
          area_type: null,
          area_type_full: null,
          area: null,
          city_fias_id: "0c5b2444-70a0-4932-980c-b4dc0d3f02b5",
          city_kladr_id: "7700000000000",
          city_with_type: "г Москва",
          city_type: "г",
          city_type_full: "город",
          city: "Москва",
          city_area: "Центральный",
          city_district_fias_id: null,
          city_district_kladr_id: null,
          city_district_with_type: null,
          city_district_type: null,
          city_district_type_full: null,
          city_district: null,
          settlement_fias_id: null,
          settlement_kladr_id: null,
          settlement_with_type: null,
          settlement_type: null,
          settlement_type_full: null,
          settlement: null,
          street_fias_id: "5ba0c536-b105-4c8b-8b9a-8b06a64a4073",
          street_kladr_id: "77000000000288000",
          street_with_type: "ул 2-я Тверская-Ямская",
          street_type: "ул",
          street_type_full: "улица",
          street: "2-я Тверская-Ямская",
          stead_fias_id: null,
          stead_cadnum: null,
          stead_type: null,
          stead_type_full: null,
          stead: null,
          house_fias_id: null,
          house_kladr_id: null,
          house_cadnum: null,
          house_flat_count: null,
          house_type: null,
          house_type_full: null,
          house: null,
          block_type: null,
          block_type_full: null,
          block: null,
          entrance: null,
          floor: null,
          flat_fias_id: null,
          flat_cadnum: null,
          flat_type: null,
          flat_type_full: null,
          flat: null,
          flat_area: null,
          square_meter_price: null,
          flat_price: null,
          room_fias_id: null,
          room_cadnum: null,
          room_type: null,
          room_type_full: null,
          room: null,
          postal_box: null,
          fias_id: "5ba0c536-b105-4c8b-8b9a-8b06a64a4073",
          fias_code: null,
          fias_level: "7",
          fias_actuality_state: "0",
          kladr_id: "77000000000288000",
          geoname_id: "524901",
          capital_marker: "0",
          okato: "45286585000",
          oktmo: "45382000",
          tax_office: "7710",
          tax_office_legal: "7710",
          timezone: null,
          geo_lat: "55.774102",
          geo_lon: "37.590282",
          beltway_hit: null,
          beltway_distance: null,
          metro: null,
          divisions: null,
          qc_geo: "2",
          qc_complete: null,
          qc_house: null,
          history_values: null,
          unparsed_parts: null,
          source: null,
          qc: null,
        },
      },
      {
        value: "г Москва, ул 3-я Тверская-Ямская",
        unrestricted_value:
          "125047, г Москва, Тверской р-н, ул 3-я Тверская-Ямская",
        data: {
          postal_code: "125047",
          country: "Россия",
          country_iso_code: "RU",
          federal_district: "Центральный",
          region_fias_id: "0c5b2444-70a0-4932-980c-b4dc0d3f02b5",
          region_kladr_id: "7700000000000",
          region_iso_code: "RU-MOW",
          region_with_type: "г Москва",
          region_type: "г",
          region_type_full: "город",
          region: "Москва",
          area_fias_id: null,
          area_kladr_id: null,
          area_with_type: null,
          area_type: null,
          area_type_full: null,
          area: null,
          city_fias_id: "0c5b2444-70a0-4932-980c-b4dc0d3f02b5",
          city_kladr_id: "7700000000000",
          city_with_type: "г Москва",
          city_type: "г",
          city_type_full: "город",
          city: "Москва",
          city_area: "Центральный",
          city_district_fias_id: null,
          city_district_kladr_id: null,
          city_district_with_type: null,
          city_district_type: null,
          city_district_type_full: null,
          city_district: null,
          settlement_fias_id: null,
          settlement_kladr_id: null,
          settlement_with_type: null,
          settlement_type: null,
          settlement_type_full: null,
          settlement: null,
          street_fias_id: "1735120d-e814-4ca2-bf8d-5f53b42ea541",
          street_kladr_id: "77000000000288100",
          street_with_type: "ул 3-я Тверская-Ямская",
          street_type: "ул",
          street_type_full: "улица",
          street: "3-я Тверская-Ямская",
          stead_fias_id: null,
          stead_cadnum: null,
          stead_type: null,
          stead_type_full: null,
          stead: null,
          house_fias_id: null,
          house_kladr_id: null,
          house_cadnum: null,
          house_flat_count: null,
          house_type: null,
          house_type_full: null,
          house: null,
          block_type: null,
          block_type_full: null,
          block: null,
          entrance: null,
          floor: null,
          flat_fias_id: null,
          flat_cadnum: null,
          flat_type: null,
          flat_type_full: null,
          flat: null,
          flat_area: null,
          square_meter_price: null,
          flat_price: null,
          room_fias_id: null,
          room_cadnum: null,
          room_type: null,
          room_type_full: null,
          room: null,
          postal_box: null,
          fias_id: "1735120d-e814-4ca2-bf8d-5f53b42ea541",
          fias_code: null,
          fias_level: "7",
          fias_actuality_state: "0",
          kladr_id: "77000000000288100",
          geoname_id: "524901",
          capital_marker: "0",
          okato: "45286585000",
          oktmo: "45382000",
          tax_office: "7710",
          tax_office_legal: "7710",
          timezone: null,
          geo_lat: "55.774148",
          geo_lon: "37.592168",
          beltway_hit: null,
          beltway_distance: null,
          metro: null,
          divisions: null,
          qc_geo: "2",
          qc_complete: null,
          qc_house: null,
          history_values: null,
          unparsed_parts: null,
          source: null,
          qc: null,
        },
      },
      {
        value: "г Москва, ул 4-я Тверская-Ямская",
        unrestricted_value:
          "125047, г Москва, Тверской р-н, ул 4-я Тверская-Ямская",
        data: {
          postal_code: "125047",
          country: "Россия",
          country_iso_code: "RU",
          federal_district: "Центральный",
          region_fias_id: "0c5b2444-70a0-4932-980c-b4dc0d3f02b5",
          region_kladr_id: "7700000000000",
          region_iso_code: "RU-MOW",
          region_with_type: "г Москва",
          region_type: "г",
          region_type_full: "город",
          region: "Москва",
          area_fias_id: null,
          area_kladr_id: null,
          area_with_type: null,
          area_type: null,
          area_type_full: null,
          area: null,
          city_fias_id: "0c5b2444-70a0-4932-980c-b4dc0d3f02b5",
          city_kladr_id: "7700000000000",
          city_with_type: "г Москва",
          city_type: "г",
          city_type_full: "город",
          city: "Москва",
          city_area: "Центральный",
          city_district_fias_id: null,
          city_district_kladr_id: null,
          city_district_with_type: null,
          city_district_type: null,
          city_district_type_full: null,
          city_district: null,
          settlement_fias_id: null,
          settlement_kladr_id: null,
          settlement_with_type: null,
          settlement_type: null,
          settlement_type_full: null,
          settlement: null,
          street_fias_id: "1b366b75-a6bb-4037-b5ab-ff8092dc3405",
          street_kladr_id: "77000000000288200",
          street_with_type: "ул 4-я Тверская-Ямская",
          street_type: "ул",
          street_type_full: "улица",
          street: "4-я Тверская-Ямская",
          stead_fias_id: null,
          stead_cadnum: null,
          stead_type: null,
          stead_type_full: null,
          stead: null,
          house_fias_id: null,
          house_kladr_id: null,
          house_cadnum: null,
          house_flat_count: null,
          house_type: null,
          house_type_full: null,
          house: null,
          block_type: null,
          block_type_full: null,
          block: null,
          entrance: null,
          floor: null,
          flat_fias_id: null,
          flat_cadnum: null,
          flat_type: null,
          flat_type_full: null,
          flat: null,
          flat_area: null,
          square_meter_price: null,
          flat_price: null,
          room_fias_id: null,
          room_cadnum: null,
          room_type: null,
          room_type_full: null,
          room: null,
          postal_box: null,
          fias_id: "1b366b75-a6bb-4037-b5ab-ff8092dc3405",
          fias_code: null,
          fias_level: "7",
          fias_actuality_state: "0",
          kladr_id: "77000000000288200",
          geoname_id: "524901",
          capital_marker: "0",
          okato: "45286585000",
          oktmo: "45382000",
          tax_office: "7710",
          tax_office_legal: "7710",
          timezone: null,
          geo_lat: "55.773008",
          geo_lon: "37.596085",
          beltway_hit: null,
          beltway_distance: null,
          metro: null,
          divisions: null,
          qc_geo: "2",
          qc_complete: null,
          qc_house: null,
          history_values: null,
          unparsed_parts: null,
          source: null,
          qc: null,
        },
      },
      {
        value: "г Москва, Тверская пл",
        unrestricted_value: "г Москва, Тверской р-н, Тверская пл",
        data: {
          postal_code: null,
          country: "Россия",
          country_iso_code: "RU",
          federal_district: "Центральный",
          region_fias_id: "0c5b2444-70a0-4932-980c-b4dc0d3f02b5",
          region_kladr_id: "7700000000000",
          region_iso_code: "RU-MOW",
          region_with_type: "г Москва",
          region_type: "г",
          region_type_full: "город",
          region: "Москва",
          area_fias_id: null,
          area_kladr_id: null,
          area_with_type: null,
          area_type: null,
          area_type_full: null,
          area: null,
          city_fias_id: "0c5b2444-70a0-4932-980c-b4dc0d3f02b5",
          city_kladr_id: "7700000000000",
          city_with_type: "г Москва",
          city_type: "г",
          city_type_full: "город",
          city: "Москва",
          city_area: "Центральный",
          city_district_fias_id: null,
          city_district_kladr_id: null,
          city_district_with_type: null,
          city_district_type: null,
          city_district_type_full: null,
          city_district: null,
          settlement_fias_id: null,
          settlement_kladr_id: null,
          settlement_with_type: null,
          settlement_type: null,
          settlement_type_full: null,
          settlement: null,
          street_fias_id: "8cad81a1-0e97-4801-8f24-56c7b56fecc0",
          street_kladr_id: "77000000000748800",
          street_with_type: "Тверская пл",
          street_type: "пл",
          street_type_full: "площадь",
          street: "Тверская",
          stead_fias_id: null,
          stead_cadnum: null,
          stead_type: null,
          stead_type_full: null,
          stead: null,
          house_fias_id: null,
          house_kladr_id: null,
          house_cadnum: null,
          house_flat_count: null,
          house_type: null,
          house_type_full: null,
          house: null,
          block_type: null,
          block_type_full: null,
          block: null,
          entrance: null,
          floor: null,
          flat_fias_id: null,
          flat_cadnum: null,
          flat_type: null,
          flat_type_full: null,
          flat: null,
          flat_area: null,
          square_meter_price: null,
          flat_price: null,
          room_fias_id: null,
          room_cadnum: null,
          room_type: null,
          room_type_full: null,
          room: null,
          postal_box: null,
          fias_id: "8cad81a1-0e97-4801-8f24-56c7b56fecc0",
          fias_code: null,
          fias_level: "7",
          fias_actuality_state: "0",
          kladr_id: "77000000000748800",
          geoname_id: "524901",
          capital_marker: "0",
          okato: "45286585000",
          oktmo: "45382000",
          tax_office: "7710",
          tax_office_legal: "7710",
          timezone: null,
          geo_lat: "55.761811",
          geo_lon: "37.610107",
          beltway_hit: null,
          beltway_distance: null,
          metro: null,
          divisions: null,
          qc_geo: "2",
          qc_complete: null,
          qc_house: null,
          history_values: null,
          unparsed_parts: null,
          source: null,
          qc: null,
        },
      },
      {
        value: "г Москва, Тверской проезд",
        unrestricted_value: "г Москва, Тверской р-н, Тверской проезд",
        data: {
          postal_code: null,
          country: "Россия",
          country_iso_code: "RU",
          federal_district: "Центральный",
          region_fias_id: "0c5b2444-70a0-4932-980c-b4dc0d3f02b5",
          region_kladr_id: "7700000000000",
          region_iso_code: "RU-MOW",
          region_with_type: "г Москва",
          region_type: "г",
          region_type_full: "город",
          region: "Москва",
          area_fias_id: null,
          area_kladr_id: null,
          area_with_type: null,
          area_type: null,
          area_type_full: null,
          area: null,
          city_fias_id: "0c5b2444-70a0-4932-980c-b4dc0d3f02b5",
          city_kladr_id: "7700000000000",
          city_with_type: "г Москва",
          city_type: "г",
          city_type_full: "город",
          city: "Москва",
          city_area: "Центральный",
          city_district_fias_id: null,
          city_district_kladr_id: null,
          city_district_with_type: null,
          city_district_type: null,
          city_district_type_full: null,
          city_district: null,
          settlement_fias_id: null,
          settlement_kladr_id: null,
          settlement_with_type: null,
          settlement_type: null,
          settlement_type_full: null,
          settlement: null,
          street_fias_id: "016862f5-f905-46b3-84d3-69539a402c90",
          street_kladr_id: "77000000000748900",
          street_with_type: "Тверской проезд",
          street_type: "проезд",
          street_type_full: "проезд",
          street: "Тверской",
          stead_fias_id: null,
          stead_cadnum: null,
          stead_type: null,
          stead_type_full: null,
          stead: null,
          house_fias_id: null,
          house_kladr_id: null,
          house_cadnum: null,
          house_flat_count: null,
          house_type: null,
          house_type_full: null,
          house: null,
          block_type: null,
          block_type_full: null,
          block: null,
          entrance: null,
          floor: null,
          flat_fias_id: null,
          flat_cadnum: null,
          flat_type: null,
          flat_type_full: null,
          flat: null,
          flat_area: null,
          square_meter_price: null,
          flat_price: null,
          room_fias_id: null,
          room_cadnum: null,
          room_type: null,
          room_type_full: null,
          room: null,
          postal_box: null,
          fias_id: "016862f5-f905-46b3-84d3-69539a402c90",
          fias_code: null,
          fias_level: "7",
          fias_actuality_state: "0",
          kladr_id: "77000000000748900",
          geoname_id: "524901",
          capital_marker: "0",
          okato: "45286585000",
          oktmo: "45382000",
          tax_office: "7710",
          tax_office_legal: "7710",
          timezone: null,
          geo_lat: "55.762449",
          geo_lon: "37.611122",
          beltway_hit: null,
          beltway_distance: null,
          metro: null,
          divisions: null,
          qc_geo: "2",
          qc_complete: null,
          qc_house: null,
          history_values: null,
          unparsed_parts: null,
          source: null,
          qc: null,
        },
      },
      {
        value: "г Москва, Тверской б-р",
        unrestricted_value: "г Москва, Тверской б-р",
        data: {
          postal_code: null,
          country: "Россия",
          country_iso_code: "RU",
          federal_district: "Центральный",
          region_fias_id: "0c5b2444-70a0-4932-980c-b4dc0d3f02b5",
          region_kladr_id: "7700000000000",
          region_iso_code: "RU-MOW",
          region_with_type: "г Москва",
          region_type: "г",
          region_type_full: "город",
          region: "Москва",
          area_fias_id: null,
          area_kladr_id: null,
          area_with_type: null,
          area_type: null,
          area_type_full: null,
          area: null,
          city_fias_id: "0c5b2444-70a0-4932-980c-b4dc0d3f02b5",
          city_kladr_id: "7700000000000",
          city_with_type: "г Москва",
          city_type: "г",
          city_type_full: "город",
          city: "Москва",
          city_area: "Центральный",
          city_district_fias_id: null,
          city_district_kladr_id: null,
          city_district_with_type: null,
          city_district_type: null,
          city_district_type_full: null,
          city_district: null,
          settlement_fias_id: null,
          settlement_kladr_id: null,
          settlement_with_type: null,
          settlement_type: null,
          settlement_type_full: null,
          settlement: null,
          street_fias_id: "2604e353-b9dd-4542-a8bf-020c8f982797",
          street_kladr_id: "77000000000288300",
          street_with_type: "Тверской б-р",
          street_type: "б-р",
          street_type_full: "бульвар",
          street: "Тверской",
          stead_fias_id: null,
          stead_cadnum: null,
          stead_type: null,
          stead_type_full: null,
          stead: null,
          house_fias_id: null,
          house_kladr_id: null,
          house_cadnum: null,
          house_flat_count: null,
          house_type: null,
          house_type_full: null,
          house: null,
          block_type: null,
          block_type_full: null,
          block: null,
          entrance: null,
          floor: null,
          flat_fias_id: null,
          flat_cadnum: null,
          flat_type: null,
          flat_type_full: null,
          flat: null,
          flat_area: null,
          square_meter_price: null,
          flat_price: null,
          room_fias_id: null,
          room_cadnum: null,
          room_type: null,
          room_type_full: null,
          room: null,
          postal_box: null,
          fias_id: "2604e353-b9dd-4542-a8bf-020c8f982797",
          fias_code: null,
          fias_level: "7",
          fias_actuality_state: "0",
          kladr_id: "77000000000288300",
          geoname_id: "524901",
          capital_marker: "0",
          okato: "45000000000",
          oktmo: "45000000",
          tax_office: "7700",
          tax_office_legal: "7700",
          timezone: null,
          geo_lat: "55.760945",
          geo_lon: "37.601978",
          beltway_hit: null,
          beltway_distance: null,
          metro: null,
          divisions: null,
          qc_geo: "2",
          qc_complete: null,
          qc_house: null,
          history_values: null,
          unparsed_parts: null,
          source: null,
          qc: null,
        },
      },
    ];
  }
}
