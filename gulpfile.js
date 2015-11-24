"use strict";
let gulp = require('gulp');
let paths = {
	styles: './sass/**/*.scss',
	scripts: './js/**/*.js'
}

/*gulp.task('scripts', () => {
	let changed = require('gulp-changed'),
		babel = require('gulp-babel');

	return gulp.src(paths.scripts)
		.pipe(changed('js'))
		.pipe(babel({
			modules: 'common',
			stage: 0
		}).on('error', e => console.error(e)))
		.pipe(gulp.dest('js'));
});

gulp.task('scripts:watch', () => {
	gulp.start('scripts');
	gulp.watch(paths.scripts, ['scripts']);
});*/

gulp.task('scripts:bundle' /*, ['scripts']*/ , cb => {
	let path = require("path");
	let Builder = require('systemjs-builder');
	let builder = new Builder();

	builder.loadConfig('js/config.js').then(() => {
		builder.config({
			transpiler: 'babel',
			babelOptions: {
				stage: 0
			}
		});
		builder.buildStatic('app/app.js', 'dist/js/app.js')
			.then(() => {
				console.log('Build complete');
				cb();
			})
			.catch(err => {
				console.log('Build error');
				console.log(err);
				cb();
			});
	}).catch(e => console.error(e));
});

gulp.task('scripts:build', ['scripts:bundle'], cb => {
	let concat = require('gulp-concat'),
		uglify = require('gulp-uglify'),
		sourcemaps = require('gulp-sourcemaps'),
		rename = require('gulp-rename');

	return gulp.src('./dist/js/app.js')
		.pipe(concat('app.js'))
		.pipe(gulp.dest('./dist/js'))
		.pipe(sourcemaps.init())
		.pipe(uglify())
		.pipe(rename('app.min.js'))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('./dist/js'));
});


gulp.task('styles', function() {
	let postcss = require('gulp-postcss');
	return gulp.src('postcss/style.css')
		.pipe(postcss([
			require('postcss-import'),
			require('postcss-nested'),
			require('postcss-cssnext'),
			require('postcss-calc'),
			require('postcss-clearfix'),
			require('autoprefixer')({
				browsers: ['last 3 versions']
			})
		]).on('error', e => console.error(e)))
		.pipe(gulp.dest('css'));
});

gulp.task('styles:watch', function() {
	gulp.start('styles');
	gulp.watch('postcss/**/*.css', ['styles']);
});

gulp.task('scripts:lint', function() {
	let jshint = require('gulp-jshint');

	return gulp.src(['js/app/**/*.js'])
		.pipe(jshint({
			globals: {},
			curly: true,
			eqnull: true,
			undef: true,
			unused: true,
			strict: true,
			shadow: true,
			browser: true,
			'-W093': 'Did you mean to return a conditional instead of an assignment?'
		}))
		.pipe(jshint.reporter('jshint-stylish'))
		.pipe(jshint.reporter('fail'));
});

gulp.task('html', () => {
	let htmlprocessor = require('gulp-htmlprocessor');
	return gulp.src('index.html')
		.pipe(htmlprocessor({}))
		.pipe(gulp.dest('dist'));
});

gulp.task('deploy:beta', () => {
	let sftp = require("gulp-sftp");
	gulp.src('dist/**/*')
		.pipe(sftp({
			host: 'beta.jsonlint.com',
			user: 'root',
			remotePath: '/var/www/beta.jsonlint.com/site/public_html/'
		}));
});

gulp.task('default', ['scripts:lint', 'scripts:build', 'html'], () => {
	gulp.src('./css/*').pipe(gulp.dest('./dist/css'));
	gulp.src('./img/*').pipe(gulp.dest('./dist/img'));
	gulp.src(['./proxy.php', './*.appcache']).pipe(gulp.dest('./dist'));
});
