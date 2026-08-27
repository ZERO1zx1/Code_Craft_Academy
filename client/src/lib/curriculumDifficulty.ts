export function difficultyGuidance(order: number) {
  if (order <= 8) return { label: "АНХАН", guidance: "Жишээг уншаад, starter code-оо бага багаар өөрчилж, Hint ашиглан үндсэн ойлголтоо батлаарай." };
  if (order <= 18) return { label: "СУУРЬ", guidance: "Өмнөх lesson-үүдийн ойлголтоо холбож, requirement-ийг бие даан задлаад кодоо туршаарай." };
  return { label: "СОРИЛТ", guidance: "Hint-ийг сүүлд ашигла. Эх сурвалж, example болон өмнөх ойлголтоо ашиглан solution-оо өөрөө төлөвлөж шалгаарай." };
}
