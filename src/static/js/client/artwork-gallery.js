/* eslint-env browser */

import {stitchArrays} from '../../shared-util/sugar.js';

export const info = {
  id: 'artworkGalleryInfo',

  pages: null,
  pageLinks: null,
  pageDirectories: null,
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

  info.pageDirectories =
    info.pages.map(pages =>
      pages.map(page =>
        page.querySelector('.image-link')
          ?.href
          .match(/(?<=\/)([^./]*?)\.[^./]*?$/)
          [1]));
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
      if (pageLink.getAttribute('href') !== '#') continue;

      pageLink.addEventListener('click', domEvent => {
        domEvent.preventDefault();
        showPage(page);
      });
    }
  }

  window.addEventListener('hashchange', () => {
    showPageFromHash();
  });
}

export function mutatePageContent() {
  showPageFromHash();
}

function showPageFromHash() {
  if (!showPageFromDirectory(location.hash.slice(1))) {
    if (info.pages[0]?.[0]) {
      showPage(info.pages[0][0]);
    }
  }
}

function showPageFromDirectory(directory) {
  for (const {pages, pageDirectories} of stitchArrays({
    pages: info.pages,
    pageDirectories: info.pageDirectories
  })) {
    const index = pageDirectories.indexOf(directory);
    if (index >= 0) {
      showPage(pages[index]);
      return true;
    }
  }

  return false;
}

function showPage(pageToShow) {
  const {pages, pageLinks} =
    stitchArrays({
      pages: info.pages,
      pageLinks: info.pageLinks,
    }).find(({pages}) => pages.includes(pageToShow));

  for (const {page, pageLink} of stitchArrays({
    page: pages,
    pageLink: pageLinks,
  })) {
    if (page === pageToShow) {
      page.classList.add('current');
      pageLink.classList.add('current');
    } else {
      page.classList.remove('current');
      pageLink.classList.remove('current');
    }
  }
}
