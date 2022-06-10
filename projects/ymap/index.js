import './index.html';
import { formTemplate } from './templates';

let clusterer;

document.addEventListener('DOMContentLoaded', () => {
  ymaps.ready(init);

  function init() {
    const myMap = new ymaps.Map('map', {
      center: [55.76, 37.64],
      controls: ['zoomControl'],
      zoom: 12,
    });

    myMap.events.add('click', async function (e) {
      const coords = e.get('coords');

      openBalloon(myMap, coords, []);
    });

    clusterer = new ymaps.Clusterer({ clusterDisableClickZoom: true });
    clusterer.options.set('hasBalloon', false);

    getGeoObjects(myMap);
    clusterer.events.add('click', function (e) {
      const geoObjectsInCluster = e.get('target').getGeoObjects();
      openBalloon(myMap, e.get('coords'), geoObjectsInCluster);
    });
  }
});

function getReviewList(currentGeoObjects) {
  let reviewListHTML = '';

  for (const review of getReviewsFromLS()) {
    if (
      currentGeoObjects.some(
        (geoObject) =>
          JSON.stringify(geoObject.geometry._coordinates) ===
          JSON.stringify(review.coords)
      )
    ) {
      reviewListHTML += `
            <div class="review">
                <div><strong>Место: </strong>${review.place}</div>
                <div><strong>Имя: </strong>${review.author}</div>
                <div><strong>Отзыв: </strong>${review.review}</div>
            </div>
            `;
    }
  }
  return reviewListHTML;
}

function getReviewsFromLS() {
  const reviews = localStorage.reviews;
  return JSON.parse(reviews || '[]');
}

function getGeoObjects(map) {
  const geoObjects = [];
  for (const review of getReviewsFromLS() || []) {
    const placemark = new ymaps.Placemark(review.coords);
    placemark.events.add('click', (e) => {
      e.stopPropagation();
      openBalloon(map, e.get('coords'), [e.get('target')]);
    });
    geoObjects.push(placemark);
  }

  clusterer.removeAll();
  map.geoObjects.remove(clusterer);
  clusterer.add(geoObjects);
  map.geoObjects.add(clusterer);
}

async function openBalloon(map, coords, currentGeoObjects) {
  await map.balloon.open(coords, {
    content: `<div class="reviews">${getReviewList(
      currentGeoObjects
    )}</div>${formTemplate}`,
  });

  document.querySelector('#add-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const review = {
      coords: coords,
      author: this.elements.author.value,
      place: this.elements.place.value,
      reviewT: this.elements.review.value,
    };

    localStorage.reviews = JSON.stringify([...getReviewsFromLS(), review]);

    getGeoObjects(map);

    map.balloon.close();
  });
}
