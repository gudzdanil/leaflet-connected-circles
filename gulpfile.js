var gulp = require('gulp'),
    connect = require('gulp-connect');

var paths = {
    scripts: ['**/*.js', '!app/js/**/_*.js']
};

gulp.task('default', ['http-server', 'watch']);

gulp.task('http-server', function(){
    connect.server({
        livereload: true,
        root: './'
    })
});


gulp.task('watch', function() {
    gulp.watch('./*.js', connect.reload);
});
