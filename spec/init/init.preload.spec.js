xdescribe('preloading multiple languages', function() {

  beforeEach(function(done) {
    i18n.init(i18n.functions.extend(opts, {
        preload: ['fr', 'de-DE'] }),
      function(t) { done(); });
  });

  it('it should load additional languages', function() {
    expect(i18n.hasResourceBundle('fr')).to.be(true);
    expect(i18n.hasResourceBundle('de-DE')).to.be(true);
    expect(i18n.hasResourceBundle('de')).to.be(true);
  });

  describe('changing the language', function() {

    beforeEach(function(done) {
      spy.reset();
      if (i18n.sync.resStore) i18n.sync.resStore = {}; // to reset for test on server!
      i18n.setLng('de-DE',
        function(t) { done(); });
    });

    it('it should reload the preloaded languages', function() {
      expect(spy.callCount).to.be(4); // de-DE, de, fr, dev
    });

  });

});