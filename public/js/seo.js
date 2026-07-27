/* SEO & Meta Tag Handler */

const SEO = {
  updateMeta: function({ title, description, image, url }) {
    if (title) {
      document.title = title;
      this.setMetaContent('title', title);
      this.setMetaProperty('og:title', title);
      this.setMetaProperty('twitter:title', title);
    }
    if (description) {
      this.setMetaContent('description', description);
      this.setMetaProperty('og:description', description);
      this.setMetaProperty('twitter:description', description);
    }
    if (image) {
      this.setMetaProperty('og:image', image);
      this.setMetaProperty('twitter:image', image);
    }
    if (url) {
      this.setMetaProperty('og:url', url);
      this.setMetaProperty('twitter:url', url);
    }
  },

  setMetaContent: function(name, content) {
    let el = document.querySelector(`meta[name="${name}"]`);
    if (el) {
      el.setAttribute('content', content);
    }
  },

  setMetaProperty: function(property, content) {
    let el = document.querySelector(`meta[property="${property}"]`);
    if (el) {
      el.setAttribute('content', content);
    }
  }
};
