<script>
import { ICON_CDN_URL } from "../../config";
import plug from "@/assets/plug.svg";

export default {
  props: {
    symbol: String,
    size: String
  },
  data() {
    return {
      formattedSymbol: '',
      srcLink: '',
      sizeClasses: {
        small: 'icon-small',
        medium: 'icon-medium'
      }
    }
  },
  methods: {
    setAltImg(e) {
      if (e.target.src !== plug) { 
        e.target.src = plug;
      }
    }
  },
  created() {
    const icons = this.$store.state.icons;
    const cryptoIconsLink = 'https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.17.2/svg/color';
    
    this.formattedSymbol = this.symbol.replace(/[0-9]/g, '');
    
    if(icons.includes(this.symbol.toUpperCase())) {
     this.srcLink = `${ICON_CDN_URL}/${this.symbol.toUpperCase()}-INV.svg`;
     return;
    }
    
    this.srcLink = `${cryptoIconsLink}/${this.formattedSymbol.toLowerCase()}.svg`
  }
}
</script>

<template>
    <img :src="srcLink"
         :key="formattedSymbol"
         :alt="formattedSymbol"
         :class="sizeClasses[size]"
         @error="setAltImg"
    />
</template>

<style scoped>
.icon-small {
  display: inline-block;
  width: 20px;
  height: 20px;
  margin-bottom: 4px;
  margin-right: 4px;
}
.icon-medium {
  display: inline-block;
  width: 30px;
  height: 30px;
  margin-bottom: 12px;
  margin-right: 8px;
}
.icon svg {
  height: auto;
  width: auto;
  display: inline-block;
}

.icon svg g .white{
  fill: #fff !important;
  stroke: #fff !important;
}
</style>