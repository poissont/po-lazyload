<?php
$onImg = get_option("lazyload_img", '0');
$onIframe = get_option("lazyload_iframe", '0');
$onBGImage = get_option("lazyload_bg", '0');

$valueImg = "";
$valueIframe = "";
$valueBG = "";
if ($onImg == '1') {
    $valueImg = "checked";
}
if ($onIframe == '1') {
    $valueIframe = "checked";
}
if ($onBGImage == '1') {
    $valueBG = "checked";
}

?>
<style>
    .field-wrapper {
        padding-top: 5px;
        padding-bottom: 15px;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        column-gap: 1rem;
        min-width: 300px;
        row-gap: .33rem;
    }

    label.field-wrapper {
        width: 300px;
    }

    p,
    small {
        width: 100%;
    }

    small code {
        font-size: 1em;
    }

    input {
        min-height: 16px;
        min-width: 16px;
    }
</style>
<div class="lazy-options">
    <h1 class="test-die">Lazyload Options</h1>
    
    <form method="post" action="options.php">
        <label class="field-wrapper">
            <span>Activate on images</span>
            <input type='checkbox' <?php echo $valueImg; ?> />
            <input type="hidden" name='lazyload_img' value='<?php echo $onImg ?>' />
        </label>
        <label class="field-wrapper">
            <span>Activate on iframes</span>
            <input type='checkbox' <?php echo $valueIframe; ?> />
            <input type="hidden" name='lazyload_iframe' value='<?php echo $onIframe ?>' />
        </label>
        <label class="field-wrapper">
            <span>Activate on background images</span>
            <input type='checkbox' <?php echo $valueBG; ?> />
            <input type="hidden" name='lazyload_bg' value='<?php echo $onBGImage ?>' />
            <small>Works only on <code>style="background-image"</code> assigned to a &lt;div&gt;</small>
        </label>

        <p>
            <button class="fake-submit button button-primary">Enregistrer</button>
        </p>
        <!-- <div style="display:none">
            <?php //submit_button("Enregistrer") 
            ?>
        </div> -->
    </form>
</div>
<script>
    jQuery(function($) {

        $("input[type='checkbox']").on("click", function(e) {
            let me = $(this);
            let bro = me.siblings("input[type='hidden']");
            if (me.is(":checked")) {
                bro.val("1");
                console.log("newVal 1")
            } else {
                bro.val("0");
                console.log("newVal 0")
            }
        });
        $(".fake-submit").on("click", function(e) {
            let lazyload_img = $("input[name='lazyload_img']").val();
            let lazyload_iframe = $("input[name='lazyload_iframe']").val();
            let lazyload_bg = $("input[name='lazyload_bg']").val();
            console.log("fakeSubmitClick", lazyload_img, lazyload_iframe, lazyload_bg);
            e.preventDefault();
            $.ajax({
                url: ajaxurl,
                data: {
                    action: "lazyloadWriteOptions",
                    lazyload_img,
                    lazyload_iframe,
                    lazyload_bg
                },
                success: function(response) {
                    // $("#submit").trigger("click");
                    console.log("response", response);
                }
            })
        });

    })
</script>