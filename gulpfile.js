// Include gulp and plugins
const gulp = require('gulp');

const del = require('del');

// pkg = require('./package.json'),

const $ = require('gulp-load-plugins')({
    lazy: true
});

// const htmlInjector = require('bs-html-injector');

const browserSync = require('browser-sync').create();

const reload = browserSync.reload;

// file locations
let devBuild =
    (process.env.NODE_ENV || 'development').trim().toLowerCase() !==
    'production';

let source = './';

let dest = devBuild ? 'builds/development/' : 'builds/production/';

let html = {
    partials: [source + '_partials/**/*'],
    in: [source + '*.html'],
    markdown: {
        in: [source + 'readme.md'],
        watch: [source + '**/*.md']
    },
    watch: ['*.html', '_partials/**/*'],
    out: dest,
    context: {
        devBuild: devBuild
    }
};
let b2bhtml = {
    partials: [source + 'b2b/_partials/**/*'],
    in: [source + 'b2b/*.html'],
    watch: [source + 'b2b/*.html', source + 'b2b/_partials/**/*'],
    out: dest + 'b2b/',
    context: {
        devBuild: devBuild
    }
};

let css = {
    in: [source + 'sass/styles.scss'],
    watch: ['sass/**/*.scss'],
    out: dest + 'css/',
    pluginCSS: {
        in: [
            source + 'css/pro.css',
            source + 'css/material-icons.css',
            source + 'css/prism.css',
            source + 'css/prism-atom-dark.css',
        ],
        watch: ['css/**/*.css'],
        out: dest + 'css/'
    },
    sassOpts: {
        outputStyle: devBuild ? 'compressed' : 'compressed',
        imagePath: '../images',
        precision: 3,
        errLogToConsole: true
    }
};

let fonts = {
    in: source + 'fonts/**/*',
    out: dest + 'fonts/'
};

let js = {
    in: source + 'js/**/*.js',
    out: dest + 'js/'
}

let syncOpts = {
    server: {
        baseDir: dest,
        index: 'index.html'
    },
    open: false,
    injectChanges: true,
    reloadDelay: 0,
    notify: true
};

// Clean tasks
gulp.task('clean', cb => {
    del([dest + '**/*'], cb());
});

gulp.task('clean-images', cb => {
    del([dest + 'images/**/*'], cb());
});

gulp.task('clean-html', () => {
    return del([dest + '**/*.html']);
});

gulp.task('clean-css', cb => {
    del([dest + 'css/**/*'], cb());
});

gulp.task('clean-js', cb => {
    del([dest + 'js/**/*'], cb());
});

// reload task
gulp.task('reload', done => {
    browserSync.reload();
    done();
});

// Markdown to HTML
/* gulp.task('mark-to-html', (cb) => {
    return gulp.src(html.markdown.in)
    .pipe($.markdown())
    .pipe($.rename('index.html'))
    .pipe(gulp.dest(dest))
}) */

// build HTML files
gulp.task('html', () => {
    var page = gulp
        .src(html.in)
        .pipe($.newer(html.out))
        .pipe($.preprocess({
            context: html.context
        }));
    /*.pipe($.replace(/.\jpg|\.png|\.tiff/g, '.webp'))*/
    if (!devBuild) {
        page = page
            .pipe($.size({
                title: 'HTML in'
            }))
            .pipe($.htmlclean())
            .pipe($.size({
                title: 'HTML out'
            }));
    }
    return (
        page.pipe(gulp.dest(html.out))
    );
});

// copy fonts
gulp.task('fonts', () => {
    return gulp
        .src(fonts.in)
        .pipe($.newer(dest + 'fonts/'))
        .pipe(gulp.dest(dest + 'fonts/'));
});

// plugin css compilation
gulp.task(
    'css',
    gulp.series('fonts', () => {
        return (
            gulp
            .src(css.pluginCSS.in, {allowEmpty: true})
            .pipe($.size({
                title: 'CSS in '
            }))
            .pipe($.newer(dest + 'css/'))
            // .pipe(cssFilter)
            .pipe(
                $.rename(function (path) {
                    path.extname = '.scss';
                })
            )
            .pipe($.sourcemaps.init())
            .pipe($.plumber())
            .pipe($.sass(css.sassOpts))
            .pipe($.sourcemaps.write('./maps'))
            // .pipe(cssFilter.restore)
            .pipe($.size({
                title: 'CSS out '
            }))
            .pipe(gulp.dest(dest + 'css/'))
            .pipe(browserSync.stream({
                match: '**/*.css'
            }))
        );
    })
);

// copy javasacript files
gulp.task('js', () => {
    return gulp
        .src(js.in)
        .pipe($.newer(dest + 'js/'))
        .pipe(gulp.dest(dest + 'js/'));
});

// sass compilation
gulp.task('sass', function(){
    return gulp.src(css.in)
    .pipe($.size({
        title: 'SCSS in '
    }))
    .pipe($.sourcemaps.init())
    .pipe($.plumber())
    .pipe($.sass(css.sassOpts))
    .pipe($.autoprefixer({
        // browsers: ['last 2 versions'],
        cascade: false
    }))
    .pipe($.size({
        title: 'SCSS out '
    }))
    .pipe($.sourcemaps.write('./maps'))
	.pipe(gulp.dest(css.out))
    .pipe(browserSync.stream({
        match: '**/*.css'
    }));
});

// browser sync
gulp.task('serve', () => {
    browserSync.init({
        server: {
            baseDir: dest,
            index: 'index.html'
        },
        // files: [dest + 'lbd/css/light-bootstrap-dashboard.css', dest + 'lbd/js/custom.js'],
        open: false,
        // port: 3000,
        injectChanges: true,
        notify: true
    });
});

gulp.task(
    'watch',
    gulp.parallel('serve', () => {
        // markdown changes
        // gulp.watch(html.markdown.watch, gulp.series('mark-to-html', 'reload'));
        // html changes
        gulp.watch(html.watch, gulp.series('html', 'reload'));
        // font changes
        gulp.watch(fonts.in, gulp.series('fonts'));
        // sass changes
        gulp.watch(css.watch, gulp.series('sass'));
        // pluginCSS changes
        gulp.watch([...css.pluginCSS.in], gulp.series('css'));
        // js changes
        gulp.watch(js.in, gulp.series('js'));
    })
);

gulp.task('build', gulp.parallel('html', 'css', 'sass', 'fonts'));

gulp.task('default', gulp.parallel('html', 'css', 'sass', 'fonts', 'js', gulp.series('watch')));
