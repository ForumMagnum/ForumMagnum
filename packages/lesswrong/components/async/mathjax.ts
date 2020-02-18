import { Meteor } from 'meteor/meteor';

if (Meteor.isClient) {
  (window as any).MathJax = {
    showMathMenu: false,
    messageStyle: "none",
    tex2jax: {
      preview: "none"
    }
  };
    
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.6/MathJax.js?config=TeX-MML-AM_CHTML';
  script.async = true;
  document.head.appendChild(script);
}
