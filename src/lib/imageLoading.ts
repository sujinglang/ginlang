// A load event is enough to display an image. Waiting for decode() again can
// leave an otherwise loaded picture hidden; a stalled request must also settle.
export function loadImage(
  image: HTMLImageElement,
  src: string,
  srcset = '',
  timeoutMs = 12000,
): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      image.removeEventListener('load', onLoad);
      image.removeEventListener('error', onError);
      resolve(ok);
    };
    const onLoad = () => finish(image.naturalWidth > 0);
    const onError = () => finish(false);
    const timeout = setTimeout(() => finish(false), timeoutMs);
    image.addEventListener('load', onLoad);
    image.addEventListener('error', onError);
    if (image.getAttribute('srcset') !== srcset) image.srcset = srcset;
    if (image.getAttribute('src') !== src) image.src = src;
    if (image.complete) finish(image.naturalWidth > 0);
  });
}
