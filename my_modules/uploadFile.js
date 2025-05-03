function save_file_on_server(file, path_of_fileupload) {
    file.mv(path_of_fileupload, function (err) {
        if (err)
            res.status(500).send(err);

        console.log(`${file.name} Saved. Locations : ${path_of_fileupload} !!`);
    });
}

module.exports = save_file_on_server;