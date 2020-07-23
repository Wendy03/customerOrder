import zh from './zh_TW.js';
import Pagination from './pagination.js';

Vue.component('ValidationProvider', VeeValidate.ValidationProvider);
Vue.component('ValidationObserver', VeeValidate.ValidationObserver);
Vue.component('loading', VueLoading);

Vue.filter('money', function (num) {
  const parts = num.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return 'NT ' + parts.join('.');
});

VeeValidate.configure({
  classes: {
    valid: 'is-valid',
    invalid: 'is-invalid',
  },
});
VeeValidate.localize('tw', zh);

const Toast = Swal.mixin({
  toast: true,
  showConfirmButton: false,
  timer: 1500,
  padding: '1em',
  position: 'top',
});

new Vue({
  el: '#app',
  data() {
    return {
      uuid: '28c229ba-c1c4-47f6-9be0-210c99409aa6',
      apiPath: 'https://course-ec-api.hexschool.io/api',
      products: [],
      product: {
        num: 0,
      },
      pagination: {},
      status: {
        loadingItem: '',
      },
      isLoading: false,
      cart: [],
      cartTotal: 0,
      form: {
        email: '',
        name: '',
        tel: '',
        address: '',
        payment: 'WebATM',
        message: '',
      },
    };
  },
  created() {
    this.getProducts();
    this.getCart();
  },
  components: {
    Pagination,
  },
  methods: {
    getProducts(page = 1) {
      const vm = this;
      const url = `${vm.apiPath}/${vm.uuid}/ec/products?page=${page}`;
      vm.isLoading = true;
      axios
        .get(url)
        .then((res) => {
          vm.isLoading = false;
          vm.products = res.data.data;
          vm.pagination = res.data.meta.pagination;
        })
        .catch((err) => {
          console.log(err);
        });
    },
    getProduct(id) {
      const vm = this;
      vm.status.loadingItem = id;
      const url = `${vm.apiPath}/${vm.uuid}/ec/product/${id}`;
      axios
        .get(url)
        .then((res) => {
          vm.product = res.data.data;
          this.$set(vm.product, 'num', 1);
          $('#productModal').modal('show');
          vm.status.loadingItem = '';
        })
        .catch((err) => {
          console.log(err);
        });
    },
    amount() {
      const vm = this;
      let total = 0;
      vm.cart.forEach((item) => {
        console.log(item);
        total += item.product.price * item.quantity;
      });
      vm.cartTotal = total;
    },
    addToCart(item, quantity = 1) {
      const vm = this;
      vm.status.loadingItem = item.id;
      const url = `${vm.apiPath}/${vm.uuid}/ec/shopping`;
      const cart = {
        product: item.id,
        quantity,
      };
      axios
        .post(url, cart)
        .then(() => {
          vm.status.loadingItem = '';
          $('#productModal').modal('hide');
          vm.getCart();
          Toast.fire({
            title: '已加入購物車',
            icon: 'success',
          });
        })
        .catch((err) => {
          this.status.loadingItem = '';
          console.log(err.response.data.errors);
          $('#productModal').modal('hide');
          Toast.fire({
            title: `${err.response.data.errors}`,
            icon: 'warning',
          });
        });
    },
    getCart() {
      const vm = this;
      vm.isLoading = true;
      const url = `${vm.apiPath}/${vm.uuid}/ec/shopping`;
      axios
        .get(url)
        .then((res) => {
          vm.cart = res.data.data;
          vm.isLoading = false;
        })
        .catch((err) => {
          console.log(err);
        });
    },
    quantityUpdate(id, num) {
      const vm = this;
      const url = `${vm.apiPath}/${vm.uuid}/ec/shopping`;
      const cart = {
        product: id,
        quantity: num,
      };
      axios
        .patch(url, cart)
        .then(() => {
          vm.getCart();
          Toast.fire({
            text: '商品已更正數量',
            icon: 'success',
          });
        })
        .catch((err) => {
          console.log(err.response.data.errors);
        });
    },
    removeCartItem(id) {
      const vm = this;
      vm.isLoading = true;
      const url = `${vm.apiPath}/${vm.uuid}/ec/shopping/${id}`;
      axios
        .delete(url)
        .then((res) => {
          vm.isLoading = false;
          vm.getCart();
          Toast.fire({
            text: '商品已刪除',
            icon: 'success',
          });
        })
        .catch((err) => {
          console.log(err);
          Toast.fire({
            text: '商品刪除失敗',
            icon: 'error',
          });
        });
    },
    removeAllCartItem() {
      const vm = this;
      vm.isLoading = true;
      const url = `${vm.apiPath}/${vm.uuid}/ec/shopping/all/product`;
      axios
        .delete(url)
        .then((res) => {
          vm.isLoading = false;
          vm.getCart();
          vm.cartTotal = 0;
          Toast.fire({
            text: '商品已全部刪除',
            icon: 'success',
          });
        })
        .catch((err) => {
          console.log(err);
          Toast.fire({
            text: '商品刪除失敗',
            icon: 'error',
          });
        });
    },
    createOrder() {
      console.log('送出表單');
      const vm = this;
      const order = vm.form;
      const url = `${vm.apiPath}/${vm.uuid}/ec/orders`;
      vm.isLoading = true;
      axios.post(url, order).then((res) => {
        vm.isLoading = false;
        Swal.fire({
          toast: true,
          text: '訂單完成，感謝訂購',
          icon: 'success',
          padding: '2em',
        });
        $('#orderModal').modal('hide');
        vm.getCart();
      });
    },
  },
});
