export const getDate = timestamp => {
  const currentDate = new Date(timestamp * 1000);

  const dateOptions = {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  const dateAndTime = currentDate.toLocaleDateString([], dateOptions);

  return dateAndTime;
};
