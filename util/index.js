export const arrayEquals = (a, b) => {
  return (
    Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((val, index) => val === b[index])
  );
};

export const convertToTimestamp = (date /*Week of January 1, 2021*/) => {
  //01 Jan 2021 00:00:00 EST
  const dateArray = date.replace(",", "").split(" ").splice(2, 5);
  const month = dateArray[0].slice(0, 3);
  const day = dateArray[1].length === 1 ? `0${dateArray[1]}` : dateArray[1];
  const year = dateArray[2];
  return Date.parse(`${day} ${month} ${year} 00:00:00 EST`);
};
