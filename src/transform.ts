// use to transform datum/redeemer where use data type = Map, becasue lucid only set canonical = true for entire object
// Example Map<Array, Int>, we want to set canonical for Map but not for Array, But lucid only can set canonical for both Map And array
// TODO if find Lucid method can support it
// This method will reduce originalString 2 character (bytes) -> affect Utxo use MinADA. 
// So that in case Utxo not use minADA, this function maybe not needed (only affect a little transaction fee)
export function transformString(originalString: string): string {
  let result = originalString;

  const bfIndex = originalString.indexOf("bf");
  if (bfIndex === -1) return result; // 'bf' not found

  const firstFfIndex = originalString.indexOf("ff", bfIndex + 2);
  if (firstFfIndex === -1) return result; // First 'ff' not found

  const secondFfIndex = originalString.indexOf("ff", firstFfIndex + 2);
  if (secondFfIndex === -1) return result; // Second 'ff' not found

  const part1 = originalString.substring(0, bfIndex);
  const part2_middle = originalString.substring(bfIndex + 2, secondFfIndex);
  const part3_end = originalString.substring(secondFfIndex + 2);

  result = part1 + "a1" + part2_middle + part3_end;
  return result;
}

// Like transformString, but use for oracle redeemer
// this method is not required, it just help comparing cbor and reduce transaction fee a little
export const transformOracleRedeemer = (cborString: string): string => {
  // 1. First, replace all occurrences of "ffffff" with "ff".
  const modifiedString = cborString.replace(/ffffff/g, "ff");

  // 2. Now, find all occurrences of "bf9f" in the *modified* string.
  const occurrences: number[] = [];
  let index = modifiedString.indexOf("bf9f");
  while (index !== -1) {
    occurrences.push(index);
    index = modifiedString.indexOf("bf9f", index + 1);
  }

  if (occurrences.length < 3) {
    console.warn(
      `Expected at least 3 occurrences of "bf9f", but found ${occurrences.length}. Returning original string.`
    );
    return cborString;
  }

  // 3. Perform the replacements for "bf9f" on the modified string.
  let result = modifiedString;
  result =
    result.substring(0, occurrences[0]) +
    "a19f" +
    result.substring(occurrences[0] + 4);
  result =
    result.substring(0, occurrences[1]) +
    "a39f" +
    result.substring(occurrences[1] + 4);
  result =
    result.substring(0, occurrences[2]) +
    "a19f" +
    result.substring(occurrences[2] + 4);
  return result.substring(0, result.length - 2);
};
