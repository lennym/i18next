describe('setting load', function() {

  describe('to current', function() {

    beforeEach(function(done) {
      i18n.init(i18n.functions.extend(opts, {
          load: 'current' }),
        function(t) { done(); });
    });

    it('it should load only current and fallback language', function() {
      expect(i18n.hasResourceBundle('en-US')).to.be(true);
      expect(i18n.hasResourceBundle('en')).to.be(false);
      expect(i18n.hasResourceBundle('dev')).to.be(true);
    });

    it('it should provide loaded resources for translation', function() {
      expect(i18n.t('simple_en-US')).to.be('ok_from_en-US');
      expect(i18n.t('simple_en')).not.to.be('ok_from_en');
      expect(i18n.t('simple_dev')).to.be('ok_from_dev');
    });

  });

  describe('to unspecific', function() {

    beforeEach(function(done) {
      i18n.init(i18n.functions.extend(opts, {
          load: 'unspecific' }),
        function(t) { done(); });
    });

    it('it should load only unspecific and fallback language', function() {
      expect(i18n.hasResourceBundle('en-US')).to.be(false);
      expect(i18n.hasResourceBundle('en')).to.be(true);
      expect(i18n.hasResourceBundle('dev')).to.be(true);
    });

    it('it should provide loaded resources for translation', function() {
      expect(i18n.t('simple_en-US')).not.to.be('ok_from_en-US');
      expect(i18n.t('simple_en')).to.be('ok_from_en');
      expect(i18n.t('simple_dev')).to.be('ok_from_dev');
    });

    it('it should return unspecific language', function() {
      expect(i18n.lng()).to.be('en');
    });

  });

});

describe('with fallback language set to false', function() {

  beforeEach(function(done) {
    i18n.init(i18n.functions.extend(opts, {
        fallbackLng: false }),
      function(t) { done(); });
  });

  it('it should load only specific and unspecific languages', function() {
    expect(i18n.hasResourceBundle('en-US')).to.be(true);
    expect(i18n.hasResourceBundle('en')).to.be(true);
    expect(i18n.hasResourceBundle('dev')).to.be(false);
  });

  it('it should provide loaded resources for translation', function() {
    expect(i18n.t('simple_en-US')).to.be('ok_from_en-US');
    expect(i18n.t('simple_en')).to.be('ok_from_en');
    expect(i18n.t('simple_dev')).not.to.be('ok_from_dev');
  });

});