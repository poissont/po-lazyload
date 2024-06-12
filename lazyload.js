let lazyloadInit = ($, debugMode) => {
  let imgCache = {};
  $("[data-keep-path]").each(function () {
    let me = $(this);
    let path = me.attr("data-keep-path");
    if (path.substr(0) != "/") {
      path = "/" + path;
    }
    imgCache[path] = me.html();
    me.addClass("keeped").attr("data-keep-path", null);
  });
  // console.log("imgCache", imgCache);
  let $window = $(window);
  let getCoords = ($item) => {
    // console.log('getCoords', $item);
    let top = $item.offset().top;
    let left = $item.offset().left;
    let height = $item.height();
    let width = $item.width();
    let bottom = top + height;
    let right = left + width;
    return { top: top, left: left, right: right, bottom: bottom };
  };

  let valueBetween = (value, min, max) => {
    return value >= min && value <= max;
  };

  let visibleInElement = ($item, coordElement, marginView) => {
    if (!marginView) {
      marginView = 0;
    }
    let small = getCoords($item);
    let big = coordElement;
    if (!big["top"]) {
      big["top"] = $window.scrollTop() - marginView;
    }
    if (!big["left"]) {
      big["left"] = 0;
    }
    if (!big["right"]) {
      big["right"] = $window.width();
    }
    if (!big["bottom"]) {
      big["bottom"] = $window.scrollTop() + $window.height() + marginView;
    }
    // console.log("visibleInElement", big);
    let visibleTop =
      valueBetween(small.top, big.top, big.bottom) ||
      valueBetween(small.bottom, big.top, big.bottom) ||
      (small.top < big.top && small.bottom > big.bottom);
    let visibleLeft =
      valueBetween(small.left, big.left, big.right) ||
      valueBetween(small.right, big.left, big.right) ||
      (small.left < big.left && small.right > big.right);

    return visibleTop && visibleLeft;
  };

  let fullyVisibleInElement = ($item, coordElement, marginView) => {
    if (!marginView) {
      marginView = 0;
    }
    let ret = false;
    let small = getCoords($item);
    let big = coordElement;
    if (!big["top"]) {
      big["top"] = $window.scrollTop() - marginView;
    }
    if (!big["left"]) {
      big["left"] = 0;
    }
    if (!big["right"]) {
      big["right"] = $window.width();
    }
    if (!big["bottom"]) {
      big["bottom"] = $window.scrollTop() + $window.height() + marginView;
    }

    if (visibleInElement($item, big, marginView)) {
      let fullX =
        valueBetween(small.top, big.top, big.bottom) &&
        valueBetween(small.bottom, big.top, big.bottom);
      let fullY =
        valueBetween(small.left, big.left, big.right) &&
        valueBetween(small.right, big.left, big.right);
      // console.log("fullyVisibleInElement", fullX, fullY);
      return fullX && fullY;
    }
    return ret;
  };

  let lazyload = (debugmode, addLazySelectors, addCheckVisibleSelectors) => {
    //IE fix
    addLazySelectors = addLazySelectors || "";
    addCheckVisibleSelectors = addCheckVisibleSelectors || "";

    //window position item
    let windowPosition = {
      top: $(window).scrollTop(),
      bottom: $(window).scrollTop() + $(window).height(),
    };
    //lazyload selector
    let lazySelector =
      ".lazy:not(.loaded), [data-lazy-src]:not(.loaded), [data-lazy-style]:not(.loaded), .lazy-container";

    let separator = ", ";
    if (addLazySelectors) {
      if (Array.isArray(addLazySelectors)) {
        lazySelector += separator + addLazySelectors.join(separator);
        lazySelector = lazySelector.replace(/_([^_]*)$/, separator + "$1");
      } else {
        lazySelector += separator + addLazySelectors;
      }
    }
    //checkvisible selector
    let checkVisibleSelector = ".check-visible ";
    if (addCheckVisibleSelectors) {
      if (Array.isArray(addCheckVisibleSelectors)) {
        checkVisibleSelector +=
          separator + addCheckVisibleSelectors.join(separator);
        checkVisibleSelector = checkVisibleSelector.replace(
          /_([^_]*)$/,
          separator + "$1"
        );
      } else {
        checkVisibleSelector += separator + addCheckVisibleSelectors;
      }
    }

    //margin outer for lazyload, in px
    let marginOuter = 20;

    function lazyLoad(item) {
      if (item.hasClass("lazy-container")) {
        item.find(lazySelector).each(function () {
          lazyLoad($(this));
        });
      } else {
        if (!debugmode) {
          console.log("lazyload");
        }
        item.addClass("loaded");
        if (item.attr("data-lazy-src")) {
          item.attr("src", item.attr("data-lazy-src"));
          item.attr("data-lazy-src", null);
        }
        if (item.attr("data-lazy-srcset")) {
          item.attr("srcset", item.attr("data-lazy-srcset"));
          item.attr("data-lazy-srcset", null);
        }
        if (item.attr("data-lazy-style")) {
          item.attr("style", item.attr("data-lazy-style"));
          item.attr("data-lazy-style", null);
        }
        let breakpoint = item.attr("data-breakpoint") * 1;
        if (breakpoint) {
          let width = window.innerWidth;
          if (width < breakpoint) {
            item.addClass("img-mobile").removeClass("img-desktop");
            item.attr("src", item.attr("data-src-lt"));
            item.attr("width", item.attr("data-width-lt"));
            item.attr("height", item.attr("data-height-lt"));
          } else {
            item.removeClass("img-mobile").addClass("img-desktop");
            item.attr("src", item.attr("data-src-gt"));
            item.attr("width", item.attr("data-width-gt"));
            item.attr("height", item.attr("data-height-gt"));
          }
        }
        let path = item.attr("data-lazy-path");
        if (path) {
          if (path.substr(0) != "/") {
            path = "/" + path;
          }
          if (!imgCache[path]) {
            item
              .closest(".svg-wrapper")
              .load(path, function (response, status) {
                if (status == "success") {
                  imgCache[path] = response;
                }
              });
          } else {
            // console.log(path, "was already loaded");
            item.closest(".svg-wrapper").html(imgCache[path]);
          }
        }
      }
    }

    function checkVisible(item, topToCheck, bottomToCheck) {
      if (item.hasClass("true-check")) {
        topToCheck += marginOuter;
        bottomToCheck -= marginOuter;
      }

      let visible = visibleInElement(item, {
        top: topToCheck,
        bottom: bottomToCheck,
      });
      if (visible) {
        if (!item.hasClass("cv-visible-once")) {
          item.trigger("item-visible-first");
        }
        item.addClass("cv-visible cv-visible-once");
        item.trigger("item-visible");
        // setTimeout(function () {
        //   item.addClass("cv-visible-once-after");
        //   item.trigger("item-visible-after");
        // }, 300);
        if (item.hasClass("cv-invisible")) {
          item.removeClass("cv-invisible");
          item.trigger("item-visible-switch");
        }
      } else {
        item.addClass("cv-invisible");
        item.trigger("item-invisible");
        if (item.hasClass("cv-visible")) {
          item.removeClass("cv-visible");
          item.trigger("item-invisible-switch");
        }
      }
    }

    $(document).ready(function () {
      initialLoad();
    });

    function debugLog(message, $image) {
      let top = $image.offset().top;
      let bottom = top + $image.height();
      let srcDisp = "";

      let src = $(this).attr("src");
      if (src) {
        console.log(src);
        let split = src.split("/");
        srcDisp = split[split.length - 1];
      }

      let image = {
        top: top,
        bottom: bottom,
        src: srcDisp,
      };
      let wi = {
        top: windowPosition.top - marginOuter,
        bottom: windowPosition.bottom + marginOuter,
      };

      console.log(message, image, wi);
    }

    function initialLoad() {
      let bottomToCheck = windowPosition.bottom + marginOuter;
      let topToCheck = windowPosition.top - marginOuter;
      let receiveTitle = $(".receive-title");
      // console.log(topToCheck, bottomToCheck);
      if (receiveTitle.length) {
        receiveTitle.html($("h1").html());
      }

      $(lazySelector).each(function () {
        let visible = visibleInElement($(this), {});
        if (visible) {
          $(this).trigger("lazyload");
          if (debugmode) {
            debugLog("lazyload initial", $(this));
          }
        }
      });

      $(checkVisibleSelector).each(function () {
        checkVisible($(this), topToCheck, bottomToCheck);
      });
    }

    $(lazySelector).on("lazyload", function () {
      lazyLoad($(this));
    });

    function scrollUp(sight) {
      $(lazySelector).each(function () {
        let visible = visibleInElement($(this), { top: sight });
        if (visible) {
          $(this).trigger("lazyload");
          if (debugmode) {
            debugLog("lazyload scroll up", $(this));
          }
        }
      });
    }

    function scrollDown(sight) {
      $(lazySelector).each(function () {
        let visible = visibleInElement($(this), { bottom: sight });
        if (visible) {
          $(this).trigger("lazyload");
          if (debugmode) {
            debugLog("lazyload scroll down", $(this));
          }
        }
      });
    }

    $("body").on("check-visible", checkVisibleSelector, function () {
      let bottomToCheck = windowPosition.bottom + marginOuter;
      let topToCheck = windowPosition.top - marginOuter;
      checkVisible($(this), topToCheck, bottomToCheck);
    });

    //window triggers
    let formerBreakpoints = {};

    $(window)
      .on("scroll resize", function () {
        //triggers on scroll & resize, updates windowPosition. Adds triggers with scroll direction
        let currentTop = $(window).scrollTop();
        let currentBottom = currentTop + $(window).height();
        if (currentTop < windowPosition.top) {
          $(window).trigger("scrollUp", currentTop - marginOuter);
        }
        if (currentTop > windowPosition.top) {
          $(window).trigger("scrollDown", currentBottom + marginOuter);
        }
        windowPosition = { top: currentTop, bottom: currentBottom };
        $(checkVisibleSelector).trigger(
          "check-visible",
          currentTop,
          currentBottom
        );
        // console.log(windowPosition);
      })

      .on("scrollDown", function (e, sight) {
        // console.log("scroll Down");
        scrollDown(sight);
      })
      .on("scrollUp", function (e, sight) {
        // console.log("scroll Up");
        scrollUp(sight);
      })
      .on("inititialLoad", function () {
        initialLoad();
      })
      .on("manualLazyload", function () {
        lazyLoad($("body").find(".lazy-container"));
      })
      .on("resize", function () {
        $("[data-breakpoint]").each(function () {
          let item = $(this);
          let breakpoint = item.attr("data-breakpoint");
          let width = window.innerWidth;
          let formerBreakpoint = formerBreakpoints[breakpoint];
          let widthLowerBreakpoint = width < breakpoint;
          if (widthLowerBreakpoint !== formerBreakpoint) {
            console.log("changed breakpoint", widthLowerBreakpoint);
            if (widthLowerBreakpoint) {
              console.log(
                "switched from desktop to mobile",
                item.attr("data-src-lt")
              );
              item.addClass("img-mobile").removeClass("img-desktop");
              item.attr("src", item.attr("data-src-lt"));
              item.attr("width", item.attr("data-width-lt"));
              item.attr("height", item.attr("data-height-lt"));
            } else {
              console.log(
                "switched from mobile to desktop",
                item.attr("data-src-gt")
              );
              item.removeClass("img-mobile").addClass("img-desktop");
              item.attr("src", item.attr("data-src-gt"));
              item.attr("width", item.attr("data-width-gt"));
              item.attr("height", item.attr("data-height-gt"));
            }
          }
          formerBreakpoints[breakpoint] = widthLowerBreakpoint;
        });
      });
  };

  lazyload(debugMode);
};
lazyloadInit(jQuery,false);
