export type JsonArray = Array<
  Json | JsonArray | string | number | boolean | null
>;
export type JsonValue = Json | JsonArray | string | number | boolean | null;

export interface Json {
  [member: string]: JsonValue;
}

export default Json;
