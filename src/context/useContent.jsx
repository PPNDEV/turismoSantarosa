import { useContext } from "react";
import { ContentContext } from "./content-context";

export function useContent() {
  return useContext(ContentContext);
}
