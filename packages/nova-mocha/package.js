Package.describe({
    name: "nova:mocha",
    summary: "Write meteor package tests with mocha and run them in the browser.",
    version: "0.27.5-nova",
    git: "https://github.com/practicalmeteor/meteor-mocha/"
});

Package.onUse(function (api) {

    api.versionsFrom("METEOR@1.0");

    api.use([
        'nova:core@0.27.5-nova',
        'nova:lib@0.27.5-nova',

        'nova:dashboard@0.27.5-nova',

        'nova:posts@0.27.5-nova',
        'nova:users@0.27.5-nova',
        'nova:comments@0.27.5-nova',
        'nova:folders@0.27.5-nova',
        'nova:flags@0.27.5-nova',
        'nova:topics@0.27.5-nova',
        'nova:messages@0.27.5-nova',
        'nova:mimages@0.27.5-nova',
        'nova:politicl-caches@0.27.5-nova',
        'nova:politicl-history@0.27.5-nova',

        'softwarerero:accounts-t9n'
    ]);

});

Package.onTest(function (api) {
    api.use([
        'nova:core@0.27.5-nova',
        'nova:users@0.27.5-nova',
        'nova:topics@0.27.5-nova',
        'nova:comments@0.27.5-nova',
        'nova:posts@0.27.5-nova',
        'nova:comments@0.27.5-nova',
        'nova:folders@0.27.5-nova',
        'nova:flags@0.27.5-nova',
        'nova:messages@0.27.5-nova',
        'nova:mimages@0.27.5-nova',
        'nova:politicl-caches@0.27.5-nova',
        'nova:politicl-history@0.27.5-nova',
        'nova:base-components@0.27.5-nova',

        'softwarerero:accounts-t9n'
    ]);

    api.use('practicalmeteor:mocha');

    // Add any files with mocha tests.
    //api.addFiles('lib/server.js');

    api.mainModule("lib/server.js", "server");
    api.mainModule("lib/client.js", "client");
});