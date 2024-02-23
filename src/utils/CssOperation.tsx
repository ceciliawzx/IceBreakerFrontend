export const disableScroll = () => {
  // scroll to top before disable
  window.scrollTo(0, 0);
  document.body.classList.add("no-scroll");

  return () => {
    document.body.classList.remove("no-scroll");
  };
};
