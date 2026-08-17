import ingredientsImage from '../assets/img/ingredients-poster.webp';
import hero2Image from '../assets/img/hero-2.webp';
import lifestyleImage from '../assets/img/lifestyle-1.webp';
import hero3Image from '../assets/img/hero-3.webp';
import awardImage from '../assets/img/award-poster.webp';
import hero1Image from '../assets/img/hero-1.webp';

/**
 * Metadata for the blog listing and every post's "related articles" grid.
 *
 * This list also drives the routes: App.jsx maps each entry to a page through
 * BLOG_PAGES, so adding a post here without adding its page there is caught in
 * development instead of shipping a card whose link 404s — which is what
 * happened to read-supplement-label and sleep-diet-stamina, inherited from the
 * old blog.html and only noticed when someone clicked.
 */
export const BLOG_POSTS = [
  {
    slug: 'shilajit-daily-energy',
    path: '/blog-shilajit-daily-energy',
    tag: 'Ingredients',
    image: ingredientsImage,
    imageAlt: "Shilajit and the other Ayurvedic herbs used in Herbal King's Man",
    date: '24 July 2026',
    readTime: '6 min read',
    title: 'Shilajit: The Himalayan Resin Behind Your Daily Energy',
    excerpt:
      'Where Shilajit comes from, why classical Ayurveda holds it in such high regard, and what a sensible daily amount looks like in a modern capsule.',
  },
  {
    slug: 'ashwagandha-everyday-stress',
    path: '/blog-ashwagandha-everyday-stress',
    tag: 'Ayurveda 101',
    image: hero2Image,
    imageAlt: 'Ayurvedic herb flat-lay with a brass mortar and pestle',
    date: '11 July 2026',
    readTime: '5 min read',
    title: 'Ashwagandha and Everyday Stress: What Ayurveda Says',
    excerpt:
      'The herb everyone has heard of, explained without the hype — its traditional role as a rasayana and the honest limits of what a supplement can do.',
  },
  {
    slug: 'morning-routine-men-30',
    path: '/blog-morning-routine-men-30',
    tag: 'Lifestyle',
    image: lifestyleImage,
    imageAlt: 'Man starting his morning with a glass of water in a modern Indian home',
    date: '28 June 2026',
    readTime: '4 min read',
    title: 'A Simple Morning Routine for Men Past Thirty',
    excerpt:
      'Five minutes, four steps and nothing you need to buy — the small morning habits that make a daily supplement worth taking in the first place.',
  },
  {
    slug: 'safed-musli-gokhru',
    path: '/blog-safed-musli-gokhru',
    tag: 'Ingredients',
    image: hero3Image,
    imageAlt: "Two Herbal King's Man bottles presented with a gold ribbon",
    date: '14 June 2026',
    readTime: '6 min read',
    title: 'Safed Musli and Gokhru: Two Herbs, One Purpose',
    excerpt:
      'Why our formula pairs these two rather than leaning on a single herb, and how each has traditionally been used to support strength and stamina.',
  },
  {
    slug: 'read-supplement-label',
    path: '/blog-read-supplement-label',
    tag: 'Quality',
    image: awardImage,
    imageAlt: 'Certificate of authenticity and purity for an Ayurvedic product',
    date: '30 May 2026',
    readTime: '5 min read',
    title: 'How to Read an Ayurvedic Supplement Label',
    excerpt:
      'Batch number, licence details, FSSAI and GMP marks, proprietary blends — a short checklist for spotting a pack that has nothing to hide.',
  },
  {
    slug: 'sleep-diet-stamina',
    path: '/blog-sleep-diet-stamina',
    tag: 'Wellness',
    image: hero1Image,
    imageAlt: "Herbal King's Man bottle on a green marble surface",
    date: '16 May 2026',
    readTime: '7 min read',
    title: 'Sleep, Diet and Stamina: The Three Habits That Matter Most',
    excerpt:
      'Before any capsule earns credit, these three basics do most of the work. Here is how to get them roughly right on an ordinary Indian schedule.',
  },
];

export function getRelatedPosts(currentSlug, slugs) {
  return slugs.map((slug) => BLOG_POSTS.find((post) => post.slug === slug)).filter(Boolean);
}
