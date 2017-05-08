var gulp = require('gulp');
var browserSync = require('browser-sync').create();
var watch = require('gulp-watch');
var fileinclude = require('gulp-file-include');
var runSequence = require('run-sequence');

var sass = require('gulp-sass');
var rename = require('gulp-rename');


var svgstore = require('gulp-svgstore');
var svgmin = require('gulp-svgmin');
var path = require('path');

var rimraf = require('rimraf');


var useref = require('gulp-useref');
var gulpif = require('gulp-if');
var uglify = require('gulp-uglify');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var cssnano = require('cssnano');


var imagemin = require('gulp-imagemin');

gulp.task('build:clean', function (cb) {
    rimraf('./dist/**/*', cb);
});


gulp.task('build:production', function () {
    var processors = [
        autoprefixer({browsers: ['> 1%']}),
        cssnano()
    ];

    return gulp.src('./src/preview/*.html')
        .pipe(useref())
        .pipe(gulpif('*.css', postcss(processors)))
        .pipe(gulpif('*.js', uglify()))
        .pipe(gulp.dest('./dist/html'));
});

gulp.task('build:images', function () {
   return gulp.src('./src/static/images/*')
       .pipe(imagemin([
           imagemin.gifsicle({interlaced: true}),
           imagemin.jpegtran({progressive: true}),
           imagemin.optipng({optimizationLevel: 5})
       ]))
       .pipe(gulp.dest('./dist/static/images'))
});



gulp.task('build:move', function () {
    gulp.src('./src/static/fonts/**/*')
        .pipe(gulp.dest('./dist/static/fonts'));
});


gulp.task('build', function () {
    runSequence('build:clean', 'build:production', ['build:images', 'build:move']);
});


gulp.task('dev:reload', function(){
    browserSync.reload()
});

gulp.task('dev:html', function () {
    return gulp.src('./src/html/*.html')
        .pipe(fileinclude({
            prefix: '@@',
            basepath: '@file'
        }))
        .pipe(gulp.dest('./src/preview'))
});

gulp.task('dev:svg', function () {
    return gulp.src('./src/static/images/icons/*.svg')
        .pipe(svgmin(function getOptions (file) {
            var prefix = path.basename(file.relative, path.extname(file.relative));
            return {
                plugins: [{
                    cleanupIDs: {
                        prefix: prefix + '-',
                        minify: false
                    }
                }]
            }
        }))
        .pipe(svgstore())
        .pipe(gulp.dest('./src/static/images/'));
});

gulp.task('dev:css', function () {
    return gulp.src('./src/static/scss/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(rename('style.css'))
        .pipe(gulp.dest('./src/static/css'))
        .pipe(browserSync.stream());
});


gulp.task('dev:serve', function () {
    browserSync.init({
        server: {
            baseDir: './',
            directory: true
        },
        startPath: './src/preview'
    });

    watch('./src/html/**/*.html', function () {
        runSequence('dev:html', 'dev:reload');
    });

    watch('./src/static/scss/**/*.scss', function(){
        runSequence('dev:css');
    });

    watch('./src/static/js/**/*.js', function(){
        runSequence('dev:reload');
    });
});

gulp.task('dev', function () {
    runSequence(['dev:html', 'dev:css', 'dev:svg'], 'dev:serve');
});