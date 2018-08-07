
<template>
  <div class="row m-3">
    <div class="col-1"></div>
    <div class="col-10">
      <h3 class="text-center">Puzzle Game Settings</h3>
      <div class="row">
        <div class="form-group">
          <label> Boulders ({{boulders}})
            <input class="form-control" v-model="boulders" type="number" min="1" max="10"/>
          </label>
        </div>
      </div>
    </div>
    <div class="col-1"></div>
</div>
</template>
