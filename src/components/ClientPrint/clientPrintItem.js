/*
 * @Author: 焦质晔
 * @Date: 2020-09-23 13:57:56
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2020-11-02 18:29:26
 */
import PropTypes from '../_utils/vue-types';
import Preview from './lib/preview';

export default {
  name: 'ClientPrintItem',
  componentName: 'ClientPrint',
  props: {
    dataSource: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
    templateRender: PropTypes.any.isRequired,
    uniqueKey: PropTypes.string,
    defaultConfig: PropTypes.object,
    closeOnPrinted: PropTypes.bool.def(false)
  },
  render() {
    const previewProps = {
      ref: 'preview',
      props: {
        ...this.$props,
        preview: !0
      }
    };
    return <Preview {...previewProps} />;
  }
};
