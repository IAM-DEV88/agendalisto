import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import { getCategoryIcon } from '../lib/categoryIcons';
import type { BusinessCategory } from '../lib/api';
import 'swiper/css';
import 'swiper/css/pagination';

interface CategorySwiperProps {
  categories: BusinessCategory[];
}

export default function CategorySwiper({ categories }: CategorySwiperProps) {
  if (!categories.length) return null;

  return (
    <Swiper
      modules={[Pagination, Autoplay]}
      autoplay={{ delay: 4500, pauseOnMouseEnter: true, disableOnInteraction: false }}
      spaceBetween={24}
      slidesPerView={1}
      pagination={{ clickable: true, el: '.swiper-pagination-custom' }}
      breakpoints={{
        640: { slidesPerView: 2 },
        1024: { slidesPerView: 3 },
        1280: { slidesPerView: 4 },
      }}
      className="pb-12"
    >
      {categories.map((cat) => (
        <SwiperSlide key={cat.id}>
          <Link to={`/explore?category=${cat.id}`} className="group block h-full">
            <div className="card h-full p-6 flex flex-col hover:border-primary-400 group-hover:shadow-xl transition-all duration-300">
              <span className="text-4xl block mb-4">
                {getCategoryIcon(cat.name)}
              </span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {cat.name}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-3">
                {cat.description}
              </p>
              <div className="mt-auto pt-4 flex items-center text-primary-600 dark:text-primary-400 font-semibold text-sm">
                Ver servicios
                <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        </SwiperSlide>
      ))}
      <div className="swiper-pagination-custom mt-8 flex justify-center"></div>
    </Swiper>
  );
}
