var jquery_ztree_toc_opts = {
    debug:false,
    is_auto_number:true,
    is_expand_all: false,
    _header_nodes: [{ id:1, pId:0, name:"AILabel与你一路同行",open:true}],
    documment_selector:'.markdown-body',
    ztreeStyle: {
        width:'230px',
        overflow: 'auto',
        position: 'fixed',
        'z-index': 2147483647,
        border: '0px none',
        left: '0px',
        top: '0px',
        paddingBottom: '30px',
		// 'overflow-x': 'hidden',
		'height': $(window).height() -10 + 'px'
    }
}
var markdown_panel_style = {
    // 'float': 'left',
    'width': $(window).width() - 250 + 'px',
    'margin-left':'230px'
};
