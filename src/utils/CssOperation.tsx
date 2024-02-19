export const disableScroll = () => {
  document.body.classList.add("no-scroll");

  return () => {
    document.body.classList.remove("no-scroll");
  };
};
