/* eslint-env browser */

import {stitchArrays} from '../../shared-util/sugar.js';

export const info = {
  id: 'artworkGalleryInfo',

  pages: null,
  pageLinks: null,
};

export function getPageReferences() {
  const containers =
    Array.from(document.getElementsByClassName('artwork-gallery'));

  info.pages =
    containers.map(container =>
      Array.from(container.getElementsByClassName('artwork-gallery-page')));

  info.pageLinks =
    containers.map(container =>
      Array.from(container.querySelectorAll('.artwork-gallery-nav a')));
}

export function addPageListeners() {
  for (const {pages, pageLinks} of stitchArrays({
    pages: info.pages,
    pageLinks: info.pageLinks,
  })) {
    for (const {page, pageLink} of stitchArrays({
      page: pages,
      pageLink: pageLinks,
    })) {
      pageLink.addEventListener('click', domEvent => {
        domEvent.preventDefault();
        const thisPage = page;
        for (const {page, pageLink} of stitchArrays({
          page: pages,
          pageLink: pageLinks,
        })) {
          if (page === thisPage) {
            page.classList.add('current');
            pageLink.classList.add('current');
          } else {
            page.classList.remove('current');
            pageLink.classList.remove('current');
          }
        }
      });
    }
  }
}
