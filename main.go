package main

import (
	"flag"
	"fmt"
	"net/http"
	_ "net/http/pprof"
	"os"
	"os/signal"
	"syscall"

	"timelapse-queue/filebrowse"
	"timelapse-queue/util"

	assetfs "github.com/elazarl/go-bindata-assetfs"
	log "github.com/sirupsen/logrus"
)

var (
	port = flag.Int("port", 8080, "Port to host web frontend.")
	root = flag.String("root", "/home/jeff", "Filesystem root.")
)

func main() {
	flag.Parse()

	// Configure logging.
	customFormatter := new(log.TextFormatter)
	customFormatter.TimestampFormat = "2006-01-02 15:04:05"
	customFormatter.FullTimestamp = true
	log.SetFormatter(customFormatter)

	ffmpegp, err := util.LocateFFmpeg()
	if err != nil {
		log.Errorf("Unable to locate ffmpeg binary: %v", err)
		fmt.Println("Either ensure the ffmpeg binary is in $PATH,")
		fmt.Println("or set the FFMPEG environment variable.")
		os.Exit(1)
		return
	} else {
		log.Infof("Located ffmpeg binary, %v", ffmpegp)
	}

	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)

	fb := &filebrowse.FileBrowser{
		Root: *root,
	}

	go func() {
		log.Infof("Hosting web frontend on port %d", *port)
		http.Handle("/filebrowser", fb)
		http.Handle("/",
			http.FileServer(
				&assetfs.AssetFS{Asset: Asset, AssetDir: AssetDir, AssetInfo: AssetInfo, Prefix: "web/build/default"}))

		err := http.ListenAndServe(fmt.Sprintf(":%d", *port), nil)
		log.Infof("HTTP server exited with status %v", err)
	}()

	sig := <-sigs
	log.Warningf("Caught signal %v", sig)
}
